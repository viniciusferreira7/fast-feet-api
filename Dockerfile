# Stage 1: Base
FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.25.0 --activate

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Stage 2: Dependencies
FROM base AS dependencies

# Install all dependencies (including dev dependencies)
RUN pnpm install --frozen-lockfile

# Stage 3: Build
FROM base AS build

# Copy node_modules from dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build the application
RUN pnpm run build

# Prune dev dependencies for production
RUN pnpm prune --prod

# Stage 4: Production
FROM node:20-alpine AS production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY --chown=nestjs:nodejs package.json ./

# Copy production node_modules from build stage
COPY --chown=nestjs:nodejs --from=build /app/node_modules ./node_modules

# Copy built application from build stage
COPY --chown=nestjs:nodejs --from=build /app/dist ./dist

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3333

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3333/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "dist/main"]
