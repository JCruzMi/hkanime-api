
FROM node:20 AS builder

LABEL version="1.0.0"
LABEL description="Consumet API (fastify) Docker Image"


RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    xdg-utils \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*


RUN apt-get update && apt-get upgrade -y && apt-get autoclean -y && apt-get autoremove -y


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

RUN npx puppeteer browsers install chrome
RUN npm install && npm update && npm cache clean --force


COPY --chown=nodejs:nodejs . .





EXPOSE 3000


USER nodejs


CMD ["npm", "start"]
