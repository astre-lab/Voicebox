FROM nginx:1.29-alpine

ARG APP_NAME=app
ARG PORT=8080

COPY . /usr/share/nginx/html

# The default nginx image listens on 80.
EXPOSE 80

LABEL org.opencontainers.image.title="${APP_NAME}"
LABEL org.opencontainers.image.description="Static production web application"
