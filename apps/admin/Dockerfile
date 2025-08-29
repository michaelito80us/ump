# Admin Dockerfile
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
COPY apps/admin/package.json ./apps/admin/
COPY packages/core/package.json ./packages/core/
COPY packages/ui/package.json ./packages/ui/
COPY packages/engine/package.json ./packages/engine/
COPY packages/plugins/package.json ./packages/plugins/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/admin ./apps/admin
COPY packages/core ./packages/core
COPY packages/ui ./packages/ui
COPY packages/engine ./packages/engine
COPY packages/plugins ./packages/plugins
COPY tsconfig.base.json ./
COPY codegen.yml ./
COPY schema.graphql ./

# Build dependencies
RUN pnpm --filter @ump/core build
RUN pnpm --filter @ump/engine build
RUN pnpm --filter @ump/ui build
RUN pnpm --filter @ump/plugins build

# Build the Next.js application
RUN pnpm --filter @ump/admin build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application
CMD ["pnpm", "--filter", "@ump/admin", "start"]