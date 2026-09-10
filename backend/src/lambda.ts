/**
 * AWS Lambda entrypoint for the KalaCUBE NestJS API.
 *
 * This wraps the same `AppModule` used by `main.ts` in an Express adapter and
 * exposes it to API Gateway (HTTP API v2) via `@codegenie/serverless-express`.
 *
 * Key serverless concerns handled here:
 *  - The bootstrapped Nest app + the serverless-express handler are cached at
 *    MODULE scope (via a promise) so warm invocations reuse the already-built
 *    app, DI container and open Mongo/Redis connections instead of rebuilding.
 *  - We call `app.init()` (NOT `app.listen()`) — there is no HTTP server; API
 *    Gateway delivers the request event straight to the Express instance.
 *  - `context.callbackWaitsForEmptyEventLoop = false` lets the function return
 *    while pooled Mongo/Redis sockets stay open for the next invocation.
 *
 * Build: `npm run build:lambda` emits `dist/lambda.js` (handler = `handler`).
 */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import serverlessExpress from '@codegenie/serverless-express';
import type { Handler, Context } from 'aws-lambda';
import { AppModule } from './app.module';

// Binary content types API Gateway must base64-encode instead of treating as
// UTF-8 text (image uploads/downloads proxied through the API, PDFs, etc.).
const binaryMimeTypes = [
  'application/octet-stream',
  'application/pdf',
  'application/zip',
  'image/*',
  'font/*',
];

/**
 * Build the Nest application once and hand back a serverless-express handler.
 * Mirrors the CORS + ValidationPipe setup in `main.ts`, minus `listen()`.
 */
async function bootstrapHandler(): Promise<Handler> {
  const expressApp = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));

  // Same CORS policy as main.ts: allow configured CLIENT_URL(s); in non-prod
  // also allow any localhost port.
  const allowed = (process.env.CLIENT_URL || 'http://localhost:3000')
    .split(',')
    .map((s) => s.trim());
  const isProd = process.env.NODE_ENV === 'production';
  app.enableCors({
    origin: (origin, cb) => {
      if (
        !origin ||
        allowed.includes(origin) ||
        (!isProd && /^http:\/\/localhost:\d+$/.test(origin))
      ) {
        cb(null, true);
      } else {
        cb(new Error(`Origin ${origin} not allowed by CORS`), false);
      }
    },
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // init() wires up the app without opening a TCP listener.
  await app.init();

  return serverlessExpress({ app: expressApp, binaryMimeTypes });
}

// Cache the bootstrap across warm invocations (module-level promise).
let handlerPromise: Promise<Handler> | undefined;

export const handler: Handler = async (event, context: Context, callback) => {
  // Keep pooled Mongo/Redis connections alive between invocations.
  context.callbackWaitsForEmptyEventLoop = false;

  if (!handlerPromise) {
    handlerPromise = bootstrapHandler();
  }
  const serverlessHandler = await handlerPromise;
  return serverlessHandler(event, context, callback);
};
