
FROM ghcr.io/puppeteer/puppeteer:20.0.0 AS builder

LABEL version="1.0.0"
LABEL description="Consumet API (fastify) Docker Image"


RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    fonts-liberation \
    --no-install-recommends && \
    apt-get upgrade -y && \
    apt-get autoclean -y && \
    apt-get autoremove -y && \
    rm -rf /var/lib/apt/lists/*


RUN groupadd -r nodejs && useradd -r -g nodejs -s /bin/bash -d /home/nodejs nodejs


RUN mkdir -p /home/nodejs/app/node_modules && chown -R nodejs:nodejs /home/nodejs/app


WORKDIR /home/nodejs/app


ARG NODE_ENV=PROD
ARG PORT=3000

ENV NODE_ENV=${NODE_ENV}
ENV PORT=${PORT}
ENV REDIS_HOST=${REDIS_HOST}
ENV REDIS_PORT=${REDIS_PORT}
ENV REDIS_PASSWORD=${REDIS_PASSWORD}


ENV NPM_CONFIG_LOGLEVEL=warn


COPY --chown=nodejs:nodejs package*.json ./


RUN npm install --no-cache && npm update && npm cache clean --force


COPY --chown=nodejs:nodejs . .


EXPOSE 3000


USER nodejs


CMD ["npm", "start"]
