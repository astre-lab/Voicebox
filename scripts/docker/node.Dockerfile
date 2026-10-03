# Generic Node application runtime.
# The collected build output must contain the application's production
# entrypoint and everything it needs to run.
FROM node:22-bookworm-slim

ARG APP_NAME=app
ARG PORT=3000
ARG START_COMMAND="node server.js"

ENV NODE_ENV=production
ENV PORT=${PORT}
ENV HOSTNAME=0.0.0.0

WORKDIR /app
COPY . .

EXPOSE ${PORT}

LABEL org.opencontainers.image.title="${APP_NAME}"
LABEL org.opencontainers.image.description="Production Node application"

CMD ["sh", "-lc", "${START_COMMAND}"]
