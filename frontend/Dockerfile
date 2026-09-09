# syntax=docker/dockerfile:1
# KalaCUBE frontend (Next.js standalone) — multi-stage build.
# Build context is the MONOREPO ROOT.  Build with:
#   docker build -f frontend/Dockerfile .

# ---- deps: install full workspace deps ----
FROM node:20-bookworm-slim AS deps
WORKDIR /repo
COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN npm ci

# ---- build: next build (output: standalone) ----
FROM node:20-bookworm-slim AS build
WORKDIR /repo
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /repo/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY frontend ./frontend
# NEXT_PUBLIC_* values are inlined at build time; override via --build-arg.
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ARG NEXT_PUBLIC_COGNITO_USER_POOL_ID=
ARG NEXT_PUBLIC_COGNITO_APP_CLIENT_ID=
ARG NEXT_PUBLIC_COGNITO_DOMAIN=
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_COGNITO_USER_POOL_ID=$NEXT_PUBLIC_COGNITO_USER_POOL_ID
ENV NEXT_PUBLIC_COGNITO_APP_CLIENT_ID=$NEXT_PUBLIC_COGNITO_APP_CLIENT_ID
ENV NEXT_PUBLIC_COGNITO_DOMAIN=$NEXT_PUBLIC_COGNITO_DOMAIN
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
RUN npm run build --workspace=frontend

# ---- runtime: minimal standalone server ----
FROM node:20-bookworm-slim AS runtime
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
WORKDIR /app
# Standalone output mirrors the monorepo layout: server.js lives under frontend/.
COPY --from=build /repo/frontend/.next/standalone ./
COPY --from=build /repo/frontend/.next/static ./frontend/.next/static
COPY --from=build /repo/frontend/public ./frontend/public
EXPOSE 3000
CMD ["node", "frontend/server.js"]
