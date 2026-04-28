FROM node:24-alpine AS build

WORKDIR /app

COPY package-lock.json ./
COPY web/package*.json ./web/

WORKDIR /app/web
RUN npm ci

COPY web/ .

RUN npm run build

FROM nginx:alpine

COPY --from=build /app/web/dist /usr/share/nginx/html
COPY web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
