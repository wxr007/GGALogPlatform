FROM node:24-alpine AS builder

WORKDIR /app

COPY package-lock.json ./
COPY server/package*.json ./server/
COPY server/prisma ./server/prisma/

WORKDIR /app/server
RUN npm ci

COPY server/ .

RUN npx prisma generate
RUN npm run build

FROM node:24-alpine

WORKDIR /app/server

COPY server/package*.json ./
COPY server/prisma ./prisma/

RUN npm ci --omit=dev
RUN npx prisma generate

COPY --from=builder /app/server/dist ./dist

RUN mkdir -p /app/server/uploads

EXPOSE 3000

CMD ["node", "dist/server.js"]
