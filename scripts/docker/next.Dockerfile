# Use this runtime only for applications that explicitly produce
# a Next.js standalone server.
FROM node:22-bookworm-slim

ARG APP_NAME=app
ARG PORT=3000

ENV NODE_ENV=production
ENV PORT=${PORT}
ENV HOSTNAME=0.0.0.0

WORKDIR /app
COPY . .

EXPOSE ${PORT}

LABEL org.opencontainers.image.title="${APP_NAME}"
LABEL org.opencontainers.image.description="Production Next.js standalone server"

CMD ["node", "server.js"]
