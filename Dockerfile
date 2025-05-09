# build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

# production stage
FROM node:20-alpine AS production

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/migrations ./migrations

RUN npm ci --omit=dev --ignore-scripts && \
  apk --no-cache add wget

# add healthchecks
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health/ready || exit 1

EXPOSE 3000

CMD ["node", "dist/index.js"]
