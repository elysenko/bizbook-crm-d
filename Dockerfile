# syntax=docker/dockerfile:1
# Combined nginx (Angular SPA) + NestJS backend container, managed by supervisord.
# Frontend: web/frontend (Angular 17)
# Backend:  /backend (NestJS 11 + Prisma 7)

# ─── Stage 1: Frontend builder ────────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY web/frontend/package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --legacy-peer-deps --no-audit --no-fund
COPY web/frontend/ ./
RUN npx ng build --base-href / --configuration production

# ─── Stage 2: Backend builder ─────────────────────────────────────────────────
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend
RUN apk add --no-cache openssl
COPY backend/package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --legacy-peer-deps --no-audit --no-fund
COPY backend/ ./
RUN npx prisma generate
RUN npm run build \
    && test -n "$(find /app/backend/dist -name main.js | head -1)" \
    || (echo 'ERROR: no main.js in dist — check tsconfig rootDir' && exit 1)

# ─── Stage 3: Runtime ─────────────────────────────────────────────────────────
FROM node:20-alpine
RUN apk add --no-cache nginx supervisor openssl bash

# Frontend static assets
COPY --from=frontend-builder /app/frontend/dist/frontend/browser /usr/share/nginx/html

# Backend runtime (dist + node_modules + prisma schema + generated client)
WORKDIR /app/backend
COPY backend/package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --legacy-peer-deps --omit=dev --no-audit --no-fund
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/backend/node_modules/.prisma ./node_modules/.prisma
COPY --from=backend-builder /app/backend/node_modules/@prisma ./node_modules/@prisma
COPY --from=backend-builder /app/backend/src/generated ./src/generated 2>/dev/null || true
COPY backend/prisma ./prisma
COPY backend/prisma.config.ts ./prisma.config.ts

# Nginx + supervisord config
COPY nginx.conf /etc/nginx/http.d/default.conf
COPY supervisord.conf /etc/supervisord.conf

# Nginx run dir + tmp for supervisord socket
RUN mkdir -p /run/nginx /tmp

EXPOSE 80
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
