FROM node:20-alpine AS build-web1
WORKDIR /app

COPY front-web-1/package.json front-web-1/package-lock.json ./
RUN npm ci

COPY front-web-1/ .
RUN npm run build

FROM node:20-alpine AS build-web2
WORKDIR /app

COPY front-web-2/package.json front-web-2/package-lock.json ./
RUN npm ci

COPY front-web-2/ .
RUN npm run build

FROM nginx:alpine
COPY --from=build-web1 /app/dist /usr/share/nginx/html
COPY --from=build-web2 /app/dist /usr/share/nginx/html/web2
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
