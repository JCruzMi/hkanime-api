FROM ghcr.io/puppeteer/puppeteer:20.0.0

LABEL version="1.0.0"
LABEL description="Consumet API (fastify) Docker Image"

# Establecer variables de entorno
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome
ENV NODE_ENV=production
ENV NPM_CONFIG_LOGLEVEL=warn

# Actualizar y instalar dependencias del sistema
USER root

RUN apt-get update && apt-get install -y \
    fonts-liberation \
    libnss3 \
    libxss1 \
    libasound2 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    --no-install-recommends && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Crear usuario y directorios necesarios
RUN groupadd -r nodejs && useradd -r -g nodejs -s /bin/bash -d /home/nodejs nodejs && \
    mkdir -p /home/nodejs/app /home/nodejs/.cache /home/nodejs/.config && \
    chown -R nodejs:nodejs /home/nodejs

# Cambiar al usuario nodejs
USER nodejs

WORKDIR /home/nodejs/app

# Copiar y instalar dependencias de npm
COPY --chown=nodejs:nodejs package*.json ./

RUN npm install

# Copiar el resto de la aplicación
COPY --chown=nodejs:nodejs . .

# Exponer el puerto de la aplicación
EXPOSE 3000

# Comando de inicio
CMD ["npm", "start"]
