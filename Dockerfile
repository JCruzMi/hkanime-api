FROM ghcr.io/puppeteer/puppeteer:20.0.0 AS builder

LABEL version="1.0.0"
LABEL description="Consumet API (fastify) Docker Image"

# Ejecutar como root para las operaciones iniciales
USER root

# Actualizar e instalar dependencias
RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    fonts-liberation \
    --no-install-recommends && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Solucionar fuentes duplicadas
RUN sed -i '3d' /etc/apt/sources.list.d/google-chrome.list

# Crear usuario y grupo nodejs
RUN groupadd -r nodejs && useradd -r -g nodejs -s /bin/bash -d /home/nodejs nodejs

# Crear directorios necesarios y asignar permisos
RUN mkdir -p /home/nodejs/app/node_modules /home/nodejs/.npm /home/nodejs/.cache && \
    chown -R nodejs:nodejs /home/nodejs/app /home/nodejs/.npm /home/nodejs/.cache

WORKDIR /home/nodejs/app

# Argumentos y variables de entorno
ARG NODE_ENV=PROD
ARG PORT=3000

ENV NODE_ENV=${NODE_ENV}
ENV PORT=${PORT}
ENV REDIS_HOST=${REDIS_HOST}
ENV REDIS_PORT=${REDIS_PORT}
ENV REDIS_PASSWORD=${REDIS_PASSWORD}

ENV NPM_CONFIG_LOGLEVEL=warn

# **Establecer PUPPETEER_SKIP_DOWNLOAD a true**
ENV PUPPETEER_SKIP_DOWNLOAD=true

# Copiar archivos de package.json
COPY --chown=nodejs:nodejs package*.json ./

# Cambiar al usuario nodejs
USER nodejs

# Ejecutar npm install
RUN npm install

# Copiar el resto de los archivos de la aplicación
COPY --chown=nodejs:nodejs . .

# Exponer el puerto 3000
EXPOSE 3000

# Comando de inicio
CMD ["npm", "start"]
