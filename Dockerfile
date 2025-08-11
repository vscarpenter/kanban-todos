# Use official Node.js LTS image for best security and compatibility
FROM node:20-bookworm-slim AS builder

# Set working directory
WORKDIR /app

# Install dependencies as non-root for security
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* bun.lockb* ./
RUN npm ci --ignore-scripts

# Copy source code
COPY . .

# Build Next.js app (production)
RUN npm run build

# Use a minimal image for serving static files
FROM node:20-bookworm-slim AS runner

WORKDIR /app

# Copy built assets and necessary files from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/next-env.d.ts ./next-env.d.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/src ./src

# Install only production dependencies
RUN npm ci --only=production --ignore-scripts

# Set environment variables for security and performance
ENV NODE_ENV=production
ENV PORT=3000

# Use non-root user for security
RUN addgroup -g 1001 -S nodegroup && adduser -S nodeuser -u 1001 -G nodegroup
USER nodeuser

# Expose port
EXPOSE 3000

# Healthcheck for container
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD wget --spider -q http://localhost:3000 || exit 1

# Start Next.js app
CMD ["npm", "start"]
