# Gateway Dockerfile
FROM node:18-alpine

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/gateway/package.json ./packages/gateway/
COPY packages/core/package.json ./packages/core/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/gateway ./packages/gateway
COPY packages/core ./packages/core
COPY tsconfig.base.json ./
COPY codegen.yml ./
COPY schema.graphql ./

# Build the application
RUN pnpm --filter @ump/core build
RUN pnpm --filter @ump/gateway build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["pnpm", "--filter", "@ump/gateway", "start"]