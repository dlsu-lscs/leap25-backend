#build stage
FROM node:latest AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

RUN npm run prepare

COPY . .

RUN npm run build

#production stage
FROM node:latest AS production

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist


RUN npm install --omit=dev --ignore-scripts

#default port for express/node
EXPOSE 3000

CMD ["node", "dist/index.js"]


