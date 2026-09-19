# DAuto — one image, one process: the API and the built frontend on the same port.
#   docker build -t dauto .
#   docker run -p 3000:3000 -e JWT_SECRET=$(openssl rand -hex 32) -v dauto-data:/app/data dauto

# ---- 1. Build the frontend ------------------------------------------------------
FROM node:22-alpine AS web
WORKDIR /web
COPY frontend/package*.json frontend/.npmrc ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---- 2. Runtime: API + static frontend --------------------------------------------
FROM node:20-alpine
RUN apk add --no-cache su-exec
WORKDIR /app
ENV NODE_ENV=production

COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY backend/src ./src
COPY backend/scripts ./scripts
COPY --from=web /web/dist ./public
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh && mkdir -p /app/data && chown -R node:node /app

ENV PORT=3000 \
    DB_PATH=/app/data/dauto.db \
    STATIC_DIR=/app/public
EXPOSE 3000
VOLUME ["/app/data"]

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health >/dev/null || exit 1

# Starts as root only long enough to fix ownership of the mounted data volume,
# then drops to the unprivileged `node` user.
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "src/server.js"]
