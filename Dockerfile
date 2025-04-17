#build stage
FROM node:23-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

#production stage
FROM node:23-slim AS production

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist

RUN npm ci --omit=dev --ignore-scripts

#default port for express/node
EXPOSE 3000

CMD ["node", "dist/index.js"]


