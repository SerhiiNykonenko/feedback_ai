# syntax=docker/dockerfile:1.7
FROM node:20-bookworm-slim AS base
WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/*

FROM base AS deps
COPY package.json package-lock.json ./
RUN --mount=type=secret,id=local_ca,required=false \
    if [ -f /run/secrets/local_ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/local_ca; fi; \
    npm ci --no-audit --no-fund

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV DATABASE_URL=postgresql://feedback:feedback@postgres:5432/feedback_ai?schema=public
ENV AUTH_SECRET=container-build-secret-at-least-32-characters
ENV AUTH_URL=http://localhost:3000
ENV AUTH_TRUST_HOST=true
ENV NEXT_PUBLIC_APP_URL=http://localhost:3000
ENV DEMO_AUTH_FALLBACK=false
RUN --mount=type=secret,id=local_ca,required=false \
    if [ -f /run/secrets/local_ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/local_ca; fi; \
    ./node_modules/.bin/prisma generate
RUN ./node_modules/.bin/next build
RUN node scripts/prepare-standalone.mjs

FROM base AS db-init
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
COPY src/domain ./src/domain
RUN --mount=type=secret,id=local_ca,required=false \
    if [ -f /run/secrets/local_ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/local_ca; fi; \
    ./node_modules/.bin/prisma generate
CMD ["sh", "-c", "./node_modules/.bin/prisma db push && npm run db:seed"]

FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
EXPOSE 3000
CMD ["node", "server.js"]
