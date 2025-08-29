# Multi-stage build: build static export, serve with nginx (non-root)

# 1) Builder: install deps and build static site to /app/out
FROM node:20-bookworm-slim AS builder
WORKDIR /app
ENV NODE_ENV=production

# Install dependencies using lockfile
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

# Copy source and build
COPY . .
RUN npm run build

# 2) Runner: nginx to serve static assets
FROM nginx:alpine AS runner

# Copy exported site
COPY --from=builder /app/out /usr/share/nginx/html

# Provide nginx config (cache static assets, single-page routing)
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Run as non-root on high port
USER nginx
EXPOSE 8080

# Healthcheck (busybox wget is available in alpine)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1

# Use default nginx entrypoint/cmd
