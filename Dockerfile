# ===============================================
# Production Dockerfile for React + Vite Frontend
# ===============================================

# ---------------------
# Stage 1: Dependencies
# ---------------------
# Use official Node.js LTS Alpine image
FROM node:20-alpine AS dependencies

# Set working directory inside container
WORKDIR /app

# Copy package files for dependency installation
# Only copying package files to leverage Docker layer caching
COPY package*.json ./

# Install production dependencies
# Using npm ci for faster, reliable, reproducible builds
RUN npm ci --only=production && npm cache clean --force

# ---------------------
# Stage 2: Build
# ---------------------
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Set build environment variables
ENV NODE_ENV=production
ENV GENERATE_SOURCEMAP=false

# Build the application for production
# This creates the dist/ directory with optimized static files
RUN npm run build

# ---------------------
# Stage 3: Production
# ---------------------
# Use Nginx Alpine for serving static files efficiently
FROM nginx:1.25-alpine AS production

# Create non-root user for security
RUN addgroup -g 1001 -S frontend && \
    adduser -S react -u 1001 -G frontend

# Copy built static files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create necessary directories and set permissions
RUN mkdir -p /var/cache/nginx /var/log/nginx /var/run && \
    chown -R react:frontend /var/cache/nginx /var/log/nginx /var/run /usr/share/nginx/html

# Create custom error page
COPY --chown=react:frontend error-pages/ /usr/share/nginx/html/

# Switch to non-root user
USER react    # Expose the port Nginx runs on - Frontend port 3002
    EXPOSE 3002

    # Add health check for Nginx
    HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
      CMD wget --no-verbose --tries=1 --spider http://localhost:3002/ || exit 1

# Start Nginx in foreground mode
CMD ["nginx", "-g", "daemon off;"]
