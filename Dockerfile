# Etapa de construcción
FROM node:22 AS builder

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

# Instalar dependencias necesarias para better-sqlite3 si es necesario, 
# pero mejor copiamos el node_modules que ya funciona del builder
WORKDIR /app

# Copiar solo lo necesario de la etapa anterior
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/node_modules ./node_modules

# Exponer el puerto que usa la app
EXPOSE 3000

# Variables de entorno para producción
ENV NODE_ENV=production
ENV PORT=3000
ENV JWT_SECRET=shinigami_secret_key_change_me_in_production

# Comando para iniciar la aplicación
CMD ["npm", "start"]
