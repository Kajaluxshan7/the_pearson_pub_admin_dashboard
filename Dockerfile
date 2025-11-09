# ---------- Build stage ----------
FROM node:20-alpine AS builder
WORKDIR /app

# Needed by esbuild and some native deps on Alpine
RUN apk add --no-cache libc6-compat

# Install deps (deterministic) before copying the whole context for caching
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Copy source
COPY . .

# Give Node more heap to prevent OOM during tsc/vite build
ENV NODE_OPTIONS="--max-old-space-size=4096"
# Optional if your build reads NODE_ENV
ENV NODE_ENV=production

# Build for production (your package.json should run: tsc --noEmit && vite build OR just vite build)
RUN npm run build

# ---------- Runtime stage ----------
FROM node:20-alpine
WORKDIR /app

# Minimal runtime: just a static file server
RUN npm install -g serve

# Copy built assets only
COPY --from=builder /app/dist ./dist

# Good practice: set env and non-root (optional)
ENV NODE_ENV=production
# USER node  # uncomment if you don’t need root inside container

EXPOSE 3002

# Serve built files; bind to all interfaces
CMD ["serve", "-s", "dist", "-l", "tcp://0.0.0.0:3002"]