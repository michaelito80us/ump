# Docker Development Environment

This document describes how to set up and run the Unified Management Platform using Docker Compose for local development.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose)
- [Node.js 18+](https://nodejs.org/) (for local development)
- [pnpm](https://pnpm.io/) package manager

## Quick Start

1. **Clone the repository and install dependencies:**

   ```bash
   git clone <repository-url>
   cd ump
   pnpm install
   ```

2. **Start all services with Docker Compose:**

   ```bash
   docker compose up -d
   ```

3. **Wait for all services to be healthy:**

   ```bash
   docker compose ps
   ```

4. **Access the applications:**
   - **Admin App**: http://localhost:3002
   - **Mobile App**: http://localhost:3001
   - **API Gateway**: http://localhost:3000/graphql
   - **Backend API**: http://localhost:4001/graphql

## Services Overview

| Service    | Port | Description                     |
| ---------- | ---- | ------------------------------- |
| `postgres` | 5432 | PostgreSQL database             |
| `redis`    | 6379 | Redis cache and pub/sub         |
| `backend`  | 4001 | GraphQL backend service         |
| `gateway`  | 3000 | API Gateway (Apollo Federation) |
| `admin`    | 3002 | Admin management console        |
| `mobile`   | 3001 | Mobile-first PWA                |

## Environment Variables

The Docker Compose setup uses development-friendly defaults. For production, you should:

1. Copy `.env.example` files to `.env` in each service directory
2. Update the environment variables with production values
3. Use `docker-compose.prod.yml` for production deployment

### Key Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET`: Secret for JWT token signing
- `CORS_ORIGINS`: Allowed CORS origins

## Development Workflow

### Starting Services

```bash
# Start all services
docker compose up -d

# Start specific services
docker compose up -d postgres redis

# View logs
docker compose logs -f backend
```

### Stopping Services

```bash
# Stop all services
docker compose down

# Stop and remove volumes (WARNING: This will delete your data)
docker compose down -v
```

### Database Operations

```bash
# Run database migrations
docker compose exec backend pnpm db:migrate

# Seed the database
docker compose exec backend pnpm db:seed

# Open Prisma Studio
docker compose exec backend pnpm db:studio
```

### Debugging

```bash
# Check service health
docker compose ps

# View service logs
docker compose logs [service-name]

# Execute commands in a running container
docker compose exec backend sh
```

## Health Checks

All services include health checks that verify:

- **PostgreSQL**: Database connectivity
- **Redis**: Cache connectivity
- **Backend**: HTTP health endpoint
- **Gateway**: GraphQL endpoint availability
- **Frontend Apps**: Next.js health endpoints

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3000, 3001, 3002, 4001, 5432, and 6379 are available
2. **Memory issues**: Increase Docker Desktop memory allocation to at least 4GB
3. **Build failures**: Run `docker compose build --no-cache` to rebuild images

### Reset Everything

```bash
# Stop all services and remove everything
docker compose down -v --rmi all

# Rebuild and start fresh
docker compose up -d --build
```

### Performance Optimization

For better development performance:

1. Use volume mounts for hot reloading (already configured)
2. Exclude `node_modules` from volume mounts (already configured)
3. Use `.dockerignore` to reduce build context (already configured)

## Production Deployment

For production deployment:

1. Create a `docker-compose.prod.yml` file
2. Use multi-stage builds for smaller images
3. Configure proper secrets management
4. Set up monitoring and logging
5. Use a reverse proxy (nginx/traefik)

## Testing the Setup

To verify everything is working:

1. **Check all services are running:**

   ```bash
   docker compose ps
   ```

2. **Test the API Gateway:**

   ```bash
   curl http://localhost:3000/health
   ```

3. **Test the Backend:**

   ```bash
   curl http://localhost:4001/health
   ```

4. **Access the GraphQL Playground:**

   - Gateway: http://localhost:3000/graphql
   - Backend: http://localhost:4001/graphql

5. **Access the web applications:**
   - Admin: http://localhost:3002
   - Mobile: http://localhost:3001

## Support

If you encounter issues:

1. Check the service logs: `docker compose logs [service-name]`
2. Verify all environment variables are set correctly
3. Ensure Docker Desktop has sufficient resources allocated
4. Try rebuilding the images: `docker compose build --no-cache`
