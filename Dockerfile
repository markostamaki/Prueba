# Etapa de construcción
FROM node:22-slim AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar todas las dependencias
RUN npm install

# Copiar el resto del código
COPY . .

# Construir la aplicación (esto genera el directorio /dist)
RUN npm run build

# Etapa de producción
FROM node:22-slim

WORKDIR /app

# Copiar solo lo necesario de la etapa anterior
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Instalar solo dependencias de producción (y tsx para ejecutar el server.ts si no quieres compilarlo a CJS)
RUN npm install --omit=dev && npm install -g tsx

# Exponer el puerto que usa la app (por defecto 3000 o el que indique la variable PORT)
EXPOSE 3000

# Variable de entorno para producción
ENV NODE_ENV=production
ENV PORT=3000

# Comando para iniciar la aplicación
CMD ["tsx", "server.ts"]
