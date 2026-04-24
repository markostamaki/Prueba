# Stage 1: Build
FROM node:20-slim AS builder

WORKDIR /app

# Install build dependencies for native modules (better-sqlite3)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Production
FROM node:20-slim

WORKDIR /app

# Create necessary directories for volumes
RUN mkdir -p /app/data /app/uploads

# Install runtime dependencies for better-sqlite3
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy only production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy built frontend and bundled server
COPY --from=builder /app/dist ./dist

# Keep track of environment
ENV NODE_ENV=production
ENV DATABASE_URL=/app/data/shinigami.db
ENV UPLOAD_DIR=/app/uploads
ENV PORT=3000

EXPOSE 3000

# Run the bundled server using standard node
CMD ["node", "dist/server.js"]
