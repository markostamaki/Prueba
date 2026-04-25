# Etapa de construcción
FROM node:22 AS builder

# Instalar dependencias necesarias para compilar módulos nativos (como better-sqlite3)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar todas las dependencias (incluyendo las de compilación)
RUN npm install

# Copiar el resto del código
COPY . .

# Construir la aplicación
RUN npm run build

# Etapa de producción
FROM node:22-slim

# Instalar librerías mínimas necesarias para ejecutar módulos nativos
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar archivos necesarios de la etapa anterior
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/node_modules ./node_modules

# Exponer el puerto
EXPOSE 3000

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3000
ENV JWT_SECRET=shinigami_secret_key_change_me_in_production
ENV DATABASE_URL=/app/data/shinigami.db

# Crear el directorio de datos para el volumen
RUN mkdir -p /app/data

# Comando para iniciar
CMD ["npm", "start"]
