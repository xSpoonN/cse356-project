FROM nginx:latest

RUN mkdir -p /var/cache/tiles

COPY ./nginx.conf /etc/nginx/nginx.conf