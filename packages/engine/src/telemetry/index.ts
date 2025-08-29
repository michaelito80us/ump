/**
 * Telemetry module for OpenTelemetry distributed tracing
 *
 * This module provides instrumentation capabilities for the UMP engine,
 * allowing distributed tracing across plugin executions and engine operations.
 */

export {
  TelemetryService,
  telemetryService,
  Traced,
  withSpan,
  initializeTelemetry,
  shutdownTelemetry,
} from './otel';

export type { TelemetryConfig } from './otel';

// Re-export OpenTelemetry API types that consumers might need
export { trace } from '@opentelemetry/api';
export type { SpanStatusCode, SpanKind } from '@opentelemetry/api';
