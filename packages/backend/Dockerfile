# Backend Dockerfile
FROM node:18-slim

# Install build dependencies for native modules
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/backend/package.json ./packages/backend/
COPY packages/core/package.json ./packages/core/
COPY packages/engine/package.json ./packages/engine/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy necessary files
COPY packages/backend ./packages/backend
COPY packages/core ./packages/core
COPY packages/engine ./packages/engine
COPY tsconfig.base.json ./
COPY codegen.yml ./
COPY schema.graphql ./

# Build the application
RUN pnpm --filter @ump/core build
RUN pnpm --filter @ump/engine build
RUN pnpm --filter @ump/backend db:generate
RUN pnpm --filter @ump/backend build

# Expose port
EXPOSE 4001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:4001/health || exit 1

# Start the application
CMD ["pnpm", "--filter", "@ump/backend", "start"]