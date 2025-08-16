import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';
import { logger } from '../utils/logger';

// Create a Registry which registers the metrics
const register = new client.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: 'ump-gateway',
  version: '0.1.0',
});

// Enable the collection of default metrics
client.collectDefaultMetrics({ register });

// Create custom metrics
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code', 'status'],
  registers: [register],
});

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10], // seconds
  registers: [register],
});

const httpRequestsInProgress = new client.Gauge({
  name: 'http_requests_in_progress',
  help: 'Number of HTTP requests currently being processed',
  labelNames: ['method', 'route'],
  registers: [register],
});

const graphqlOperationsTotal = new client.Counter({
  name: 'graphql_operations_total',
  help: 'Total number of GraphQL operations',
  labelNames: ['operation_name', 'operation_type', 'status'],
  registers: [register],
});

const graphqlOperationDuration = new client.Histogram({
  name: 'graphql_operation_duration_seconds',
  help: 'Duration of GraphQL operations in seconds',
  labelNames: ['operation_name', 'operation_type'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10], // seconds
  registers: [register],
});

const activeConnections = new client.Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
  registers: [register],
});

const memoryUsage = new client.Gauge({
  name: 'process_memory_usage_bytes',
  help: 'Process memory usage in bytes',
  labelNames: ['type'],
  registers: [register],
});

// Update memory metrics every 10 seconds
setInterval(() => {
  const usage = process.memoryUsage();
  memoryUsage.set({ type: 'rss' }, usage.rss);
  memoryUsage.set({ type: 'heapTotal' }, usage.heapTotal);
  memoryUsage.set({ type: 'heapUsed' }, usage.heapUsed);
  memoryUsage.set({ type: 'external' }, usage.external);
}, 10000);

// Helper function to normalize route paths
function normalizeRoute(path: string): string {
  // Replace dynamic segments with placeholders
  return path
    .replace(/\/\d+/g, '/:id')
    .replace(/\/[a-f0-9-]{36}/g, '/:uuid')
    .replace(/\/[a-f0-9]{24}/g, '/:objectId');
}

// Helper function to get status category
function getStatusCategory(statusCode: number): string {
  if (statusCode >= 200 && statusCode < 300) return '2xx';
  if (statusCode >= 300 && statusCode < 400) return '3xx';
  if (statusCode >= 400 && statusCode < 500) return '4xx';
  if (statusCode >= 500) return '5xx';
  return 'unknown';
}

// Middleware to collect HTTP metrics
export function metricsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now();
  const route = normalizeRoute(req.path);
  const method = req.method;

  // Increment in-progress requests
  httpRequestsInProgress.inc({ method, route });

  // Override res.end to capture metrics when response is sent
  const originalEnd = res.end.bind(res);
  res.end = function (this: Response, ...args: any[]): Response {
    const duration = (Date.now() - startTime) / 1000;
    const statusCode = res.statusCode;
    const status = getStatusCategory(statusCode);

    // Record metrics
    httpRequestsTotal.inc({
      method,
      route,
      status_code: statusCode.toString(),
      status,
    });
    httpRequestDuration.observe(
      { method, route, status_code: statusCode.toString() },
      duration
    );
    httpRequestsInProgress.dec({ method, route });

    // Log slow requests
    if (duration > 1) {
      logger.warn('Slow request detected', {
        method,
        route,
        duration,
        statusCode,
      });
    }

    // Call original end method and return this for chaining
    originalEnd(...args);
    return this;
  };

  next();
}

// GraphQL metrics helpers
export function recordGraphQLOperation(
  operationName: string | undefined,
  operationType: string,
  duration: number,
  success: boolean
): void {
  const name = operationName || 'anonymous';
  const status = success ? 'success' : 'error';

  graphqlOperationsTotal.inc({
    operation_name: name,
    operation_type: operationType,
    status,
  });
  graphqlOperationDuration.observe(
    { operation_name: name, operation_type: operationType },
    duration
  );
}

// Connection tracking
export function incrementActiveConnections(): void {
  activeConnections.inc();
}

export function decrementActiveConnections(): void {
  activeConnections.dec();
}

// Metrics endpoint handler
export async function metricsHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (error) {
    logger.error('Error generating metrics:', error);
    res.status(500).end('Error generating metrics');
  }
}

// Export the register for testing
export { register };

// Export individual metrics for advanced usage
export {
  httpRequestsTotal,
  httpRequestDuration,
  httpRequestsInProgress,
  graphqlOperationsTotal,
  graphqlOperationDuration,
  activeConnections,
  memoryUsage,
};
