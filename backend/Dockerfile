# syntax=docker/dockerfile:1
# KalaCUBE backend (NestJS) — multi-stage build.
# Build context is the MONOREPO ROOT so npm workspaces resolve against the
# root package-lock.json. Build with:  docker build -f backend/Dockerfile .

# ---- deps: install full workspace deps (incl. native modules like bcrypt) ----
FROM node:20-bookworm-slim AS deps
WORKDIR /repo
# Toolchain for any native addons that lack a prebuilt binary.
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN npm ci

# ---- build: compile TypeScript -> dist ----
FROM node:20-bookworm-slim AS build
WORKDIR /repo
COPY --from=deps /repo/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY backend ./backend
RUN npm run build --workspace=backend

# ---- runtime: slim production image ----
FROM node:20-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
# Root node_modules holds the hoisted workspace dependencies.
COPY --from=deps /repo/node_modules ./node_modules
# dist already includes email/templates/*.hbs via nest-cli.json "assets".
COPY --from=build /repo/backend/dist ./dist
COPY backend/package.json ./package.json
EXPOSE 8000
# Bull/Mongo connections are read from env at boot (see .env.docker.example).
CMD ["node", "dist/main.js"]
