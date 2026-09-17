FROM node:20-alpine AS base
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

ENV NODE_ENV=production
ENV DB_PATH=/app/data/dauto.db
EXPOSE 3000

RUN mkdir -p /app/data && chown -R node:node /app/data
USER node
CMD ["node", "src/server.js"]
