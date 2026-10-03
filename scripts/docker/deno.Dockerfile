FROM denoland/deno:latest

ARG APP_NAME=app
ARG PORT=3000
ARG START_COMMAND="deno run --allow-net server.ts"

ENV PORT=${PORT}

WORKDIR /app
COPY . .

EXPOSE ${PORT}

LABEL org.opencontainers.image.title="${APP_NAME}"
LABEL org.opencontainers.image.description="Production Deno application"

CMD ["sh", "-lc", "${START_COMMAND}"]
