import { NodeSDK } from '@opentelemetry/sdk-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-otlp-grpc';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { trace, context, SpanStatusCode, SpanKind } from '@opentelemetry/api';

/**
 * OpenTelemetry configuration and initialization for the UMP engine.
 * Provides distributed tracing capabilities across the plugin system.
 */
export class TelemetryService {
  private sdk: NodeSDK | null = null;
  private tracer = trace.getTracer('ump-engine', '1.0.0');
  private isInitialized = false;

  /**
   * Initialize OpenTelemetry SDK with OTLP exporter
   * @param config Configuration options for telemetry
   */
  initialize(config: TelemetryConfig = {}): void {
    if (this.isInitialized) {
      console.warn('TelemetryService already initialized');
      return;
    }

    const {
      serviceName = 'ump-engine',
      serviceVersion = '1.0.0',
      otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT ||
        'http://localhost:4318/v1/traces',
      environment = process.env.NODE_ENV || 'development',
      enableAutoInstrumentation = true,
    } = config;

    // Configure resource attributes
    const resourceAttributes: Record<string, string | number | boolean> = {
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
      [SemanticResourceAttributes.SERVICE_VERSION]: serviceVersion,
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: environment,
    };
    const resource = new Resource(resourceAttributes);

    // Configure OTLP trace exporter
    console.log('Configuring OTLP gRPC exporter with endpoint:', otlpEndpoint);
    const traceExporter = new OTLPTraceExporter({
      url: otlpEndpoint,
    });

    // Add debugging for export failures
    const originalExport = traceExporter.export.bind(traceExporter);
    traceExporter.export = (spans: any, resultCallback: any) => {
      console.log(
        `Attempting to export ${spans.length} spans to ${otlpEndpoint}`
      );
      // Log span details for debugging
      spans.forEach((span: any, index: number) => {
        console.log(`Span ${index}:`, {
          name: span.name,
          traceId: span.spanContext?.traceId,
          spanId: span.spanContext?.spanId,
          resource: span.resource?.attributes,
        });
      });
      return originalExport(spans, (result: any) => {
        if (result.code === 0) {
          console.log('Spans exported successfully');
        } else {
          console.error('Failed to export spans:', result);
        }
        resultCallback(result);
      });
    };

    // Initialize SDK
    this.sdk = new NodeSDK({
      resource: resource as any,
      traceExporter,
      instrumentations: enableAutoInstrumentation
        ? [getNodeAutoInstrumentations()]
        : [],
    });

    try {
      this.sdk.start();
      this.isInitialized = true;
      // Get a fresh tracer instance after SDK initialization
      this.tracer = trace.getTracer(serviceName, serviceVersion);
      console.log('OpenTelemetry initialized successfully');
    } catch (error) {
      console.error('Failed to initialize OpenTelemetry:', error);
      throw error;
    }
  }

  /**
   * Force flush all pending spans to the exporter
   */
  async flush(): Promise<void> {
    if (this.sdk) {
      try {
        console.log('Starting telemetry flush...');

        // Try to access the trace provider and its internal processor
        const provider = trace.getTracerProvider() as any;
        console.log('Got trace provider:', !!provider);

        // Try multiple approaches to access the span processor
        let processor = null;
        let actualProvider = provider;

        // Check if provider has a delegate (common in OpenTelemetry)
        if (provider && provider._delegate) {
          console.log('Found _delegate, using it as actual provider');
          actualProvider = provider._delegate;
          console.log('Delegate keys:', Object.keys(actualProvider));
        }

        // Approach 1: Check if provider has activeSpanProcessor property
        if (actualProvider && actualProvider.activeSpanProcessor) {
          console.log('Found activeSpanProcessor property');
          processor = actualProvider.activeSpanProcessor;
        }

        // Approach 2: Check if provider has _registeredSpanProcessors array
        if (
          !processor &&
          actualProvider &&
          actualProvider._registeredSpanProcessors
        ) {
          console.log(
            'Found _registeredSpanProcessors array with length:',
            actualProvider._registeredSpanProcessors.length
          );
          processor = actualProvider._registeredSpanProcessors[0]; // Get first processor
        }

        // Approach 3: Check if provider has _spanProcessors array
        if (!processor && actualProvider && actualProvider._spanProcessors) {
          console.log(
            'Found _spanProcessors array with length:',
            actualProvider._spanProcessors.length
          );
          processor = actualProvider._spanProcessors[0]; // Get first processor
        }

        // Approach 4: Check if provider has _processor property
        if (!processor && actualProvider && actualProvider._processor) {
          console.log('Found _processor property');
          processor = actualProvider._processor;
        }

        // Approach 5: Check if provider has getActiveSpanProcessor method
        if (
          !processor &&
          actualProvider &&
          typeof actualProvider.getActiveSpanProcessor === 'function'
        ) {
          console.log('Found getActiveSpanProcessor method');
          processor = actualProvider.getActiveSpanProcessor();
        }

        if (processor && typeof processor.forceFlush === 'function') {
          console.log('Calling forceFlush on processor...');
          await processor.forceFlush();
          console.log('Telemetry spans flushed successfully via processor');
          return;
        }

        // Fallback: try forceFlush on provider directly
        if (provider && typeof provider.forceFlush === 'function') {
          console.log('Calling forceFlush on provider...');
          await provider.forceFlush();
          console.log('Telemetry spans flushed successfully via provider');
          return;
        }

        console.warn('No forceFlush method available on provider or processor');
        console.log(
          'Provider keys:',
          provider ? Object.keys(provider) : 'no provider'
        );
      } catch (error) {
        console.error('Error flushing telemetry spans:', error);
        throw error;
      }
    } else {
      console.warn('SDK not initialized, cannot flush');
    }
  }

  /**
   * Shutdown the telemetry service gracefully
   */
  async shutdown(): Promise<void> {
    if (this.sdk) {
      try {
        // Force flush any pending spans before shutdown
        await this.flush();

        // Shutdown with timeout to prevent hanging
        const shutdownPromise = this.sdk.shutdown();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Shutdown timeout')), 5000);
        });

        await Promise.race([shutdownPromise, timeoutPromise]);

        this.isInitialized = false;
        this.sdk = null;
        console.log('OpenTelemetry shutdown successfully');
      } catch (error) {
        console.error('Error shutting down OpenTelemetry:', error);
        // Force cleanup even if shutdown fails
        this.isInitialized = false;
        this.sdk = null;
        throw error;
      }
    }
  }

  /**
   * Create a new span for plugin execution
   * @param pluginId The ID of the plugin being executed
   * @param operation The operation being performed
   * @param attributes Additional span attributes
   */
  startPluginSpan(
    pluginId: string,
    operation: string,
    attributes: Record<string, string | number | boolean> = {}
  ) {
    return this.tracer.startSpan(`plugin.${pluginId}.${operation}`, {
      kind: SpanKind.INTERNAL,
      attributes: {
        'plugin.id': pluginId,
        'plugin.operation': operation,
        ...attributes,
      },
    });
  }

  /**
   * Create a new span for engine operations
   * @param operation The operation being performed
   * @param attributes Additional span attributes
   */
  startEngineSpan(
    operation: string,
    attributes: Record<string, string | number | boolean> = {}
  ) {
    return this.tracer.startSpan(`engine.${operation}`, {
      kind: SpanKind.INTERNAL,
      attributes: {
        'engine.operation': operation,
        ...attributes,
      },
    });
  }

  /**
   * Instrument a function with automatic span creation
   * @param name The span name
   * @param fn The function to instrument
   * @param attributes Additional span attributes
   */
  async instrument<T>(
    name: string,
    fn: () => Promise<T> | T,
    attributes: Record<string, string | number | boolean> = {}
  ): Promise<T> {
    console.log(`Creating span: ${name}`);
    const span = this.tracer.startSpan(name, {
      kind: SpanKind.INTERNAL,
      attributes,
    });
    console.log(`Span created with ID: ${span.spanContext().spanId}`);

    // Execute the function within the span context to enable proper nesting
    return context.with(trace.setSpan(context.active(), span), async () => {
      try {
        const result = await fn();
        span.setStatus({ code: SpanStatusCode.OK });
        console.log(`Span ${name} completed successfully`);
        return result;
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : 'Unknown error',
        });
        span.recordException(error as Error);
        console.log(`Span ${name} failed with error:`, error);
        throw error;
      } finally {
        span.end();
        console.log(`Span ${name} ended`);
      }
    });
  }

  /**
   * Add custom attributes to the current active span
   * @param attributes Key-value pairs to add as span attributes
   */
  addAttributes(attributes: Record<string, string | number | boolean>): void {
    const activeSpan = trace.getActiveSpan();
    if (activeSpan) {
      activeSpan.setAttributes(attributes);
    }
  }

  /**
   * Record an exception in the current active span
   * @param error The error to record
   */
  recordException(error: Error): void {
    const activeSpan = trace.getActiveSpan();
    if (activeSpan) {
      activeSpan.recordException(error);
      activeSpan.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });
    }
  }

  /**
   * Get the current tracer instance
   */
  getTracer() {
    return this.tracer;
  }

  /**
   * Check if telemetry is initialized
   */
  get initialized(): boolean {
    return this.isInitialized;
  }
}

/**
 * Configuration interface for telemetry service
 */
export interface TelemetryConfig {
  serviceName?: string;
  serviceVersion?: string;
  otlpEndpoint?: string;
  environment?: string;
  enableAutoInstrumentation?: boolean;
}

/**
 * Global telemetry service instance
 */
export const telemetryService = new TelemetryService();

/**
 * Decorator for automatic method instrumentation
 * @param spanName Optional custom span name
 */
export function Traced(spanName?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor?: PropertyDescriptor
  ) {
    // Handle both method and property decorators
    if (descriptor) {
      // Method decorator
      const originalMethod = descriptor.value;
      const className = target.constructor.name;
      const methodName = propertyKey;
      const finalSpanName = spanName || `${className}.${methodName}`;

      descriptor.value = async function (...args: any[]) {
        return telemetryService.instrument(
          finalSpanName,
          () => originalMethod.apply(this, args),
          {
            'method.class': className,
            'method.name': methodName,
          }
        );
      };

      return descriptor;
    } else {
      // Property decorator - return undefined for TypeScript compatibility
      return undefined as any;
    }
  };
}

/**
 * Helper function to create a child span from the current context
 * @param name Span name
 * @param fn Function to execute within the span
 * @param attributes Optional span attributes
 */
export async function withSpan<T>(
  name: string,
  fn: () => Promise<T> | T,
  attributes?: Record<string, string | number | boolean>
): Promise<T> {
  return telemetryService.instrument(name, fn, attributes);
}

/**
 * Initialize telemetry with default configuration
 * Should be called once at application startup
 */
export function initializeTelemetry(config?: TelemetryConfig): void {
  telemetryService.initialize(config);
}

/**
 * Force flush all pending spans to the exporter
 * Useful for ensuring spans are sent before querying them
 */
export async function flushTelemetry(): Promise<void> {
  await telemetryService.flush();
}

/**
 * Shutdown telemetry gracefully
 * Should be called during application shutdown
 */
export async function shutdownTelemetry(): Promise<void> {
  await telemetryService.shutdown();
}
