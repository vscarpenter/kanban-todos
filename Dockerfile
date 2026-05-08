# Multi-stage build: build static export with Bun, serve with nginx (non-root)

# 1) Builder: install deps with the same package manager as CI (bun) and build
FROM node:20-bookworm-slim AS builder
WORKDIR /app
ENV NODE_ENV=production

# Install Bun (matches `packageManager` pin in package.json and CI).
# `git` is needed by the `next build` script's NEXT_PUBLIC_BUILD_HASH=$(git rev-parse ...)
# fallback; without it the env var falls back to "dev" which is fine but git is small.
ARG BUN_VERSION=1.3.5
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl unzip ca-certificates git \
    && rm -rf /var/lib/apt/lists/* \
    && curl -fsSL https://bun.sh/install | bash -s "bun-v${BUN_VERSION}"
ENV PATH="/root/.bun/bin:${PATH}"

# Install dependencies from the bun lockfile, with no lifecycle scripts so a
# compromised transitive dep cannot run code in the build container.
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --ignore-scripts

# Copy source and build static export to /app/out
COPY . .
RUN bun run build

# 2) Runner: nginx to serve static assets
FROM nginx:alpine AS runner

# Copy exported site
COPY --from=builder /app/out /usr/share/nginx/html

# Provide nginx config (cache static assets, single-page routing, security headers).
# nginx's `add_header` does not inherit into nested location blocks that define
# their own `add_header`, so the security headers live in a snippet that each
# block `include`s explicitly.
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/security-headers.conf /etc/nginx/security-headers.conf

# Run as non-root on high port
USER nginx
EXPOSE 8080

# Healthcheck (busybox wget is available in alpine)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1

# Use default nginx entrypoint/cmd
