FROM node:20-alpine

RUN apk add --no-cache nginx aws-cli && \
    mkdir -p /run/nginx /usr/share/nginx/html

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

RUN cp -r /app/dist/* /usr/share/nginx/html/

COPY nginx.conf /etc/nginx/http.d/default.conf
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
