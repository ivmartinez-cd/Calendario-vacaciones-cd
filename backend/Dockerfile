FROM node:20-alpine

# Prisma necesita OpenSSL para su motor de consultas en Alpine.
RUN apk add --no-cache openssl

WORKDIR /app

# Dependencias (incluye dev para tsx/prisma en arranque)
COPY package*.json ./
RUN npm install

# Código fuente y Prisma
COPY . .
RUN npx prisma generate

EXPOSE 4000

# El entrypoint aplica migraciones, siembra datos y arranca el servidor.
RUN chmod +x ./docker-entrypoint.sh
ENTRYPOINT ["./docker-entrypoint.sh"]
