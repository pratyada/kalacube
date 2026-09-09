import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Allow the configured client URL(s). In non-production, also allow any
  // localhost port (the dev frontend may run on 3000/3005/etc).
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

  const port = process.env.PORT || 8000;
  await app.listen(port);
  console.log(`kalaCUBE API running on port ${port}`);
}
bootstrap();
