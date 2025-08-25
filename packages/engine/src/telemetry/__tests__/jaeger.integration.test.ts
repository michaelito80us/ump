import { execSync, ChildProcess } from 'child_process';
import {
  initializeTelemetry,
  shutdownTelemetry,
  Traced,
  withSpan,
  flushTelemetry,
} from '../otel';
import fetch from 'node-fetch';
import path from 'path';

// Skip integration tests in CI or when Docker is not available
const shouldSkipIntegrationTests =
  process.env.CI === 'true' || process.env.SKIP_INTEGRATION_TESTS === 'true';

// No mocking - use real Jaeger API to verify actual span export
// This allows the tests to verify that spans are actually exported to Jaeger

const JAEGER_PORT = 16686;
const OTLP_GRPC_PORT = 4317;
const JAEGER_API_URL = `http://localhost:${JAEGER_PORT}/api`;
const OTLP_ENDPOINT = `http://localhost:${OTLP_GRPC_PORT}`;
const TEST_SERVICE_NAME = 'test-engine-service';
const DOCKER_COMPOSE_FILE = path.join(
  __dirname,
  '../../../docker-compose.jaeger.yml'
);

const describeIntegration = shouldSkipIntegrationTests
  ? describe.skip
  : describe;

describeIntegration('Jaeger Integration Tests', () => {
  let _dockerProcess: ChildProcess;

  beforeAll(async () => {
    // Start Jaeger using Docker Compose
    console.log('Starting Jaeger container...');
    try {
      execSync(`docker-compose -f "${DOCKER_COMPOSE_FILE}" down`, {
        stdio: 'ignore',
      });
    } catch (_error) {
      // Ignore errors if containers don't exist
    }

    execSync(`docker-compose -f "${DOCKER_COMPOSE_FILE}" up -d`, {
      stdio: 'inherit',
    });

    // Wait for Jaeger to be ready
    await waitForJaeger();

    // Initialize telemetry service with test configuration
    initializeTelemetry({
      serviceName: TEST_SERVICE_NAME,
      otlpEndpoint: OTLP_ENDPOINT,
      enableAutoInstrumentation: false, // Disable auto-instrumentation for cleaner tests
    });

    // Give some time for initialization and export
    await new Promise((resolve) => setTimeout(resolve, 3000));

    console.log(
      'Telemetry service initialized, checking Jaeger connectivity...'
    );

    // Verify Jaeger API is accessible
    const servicesResponse = await fetch(`${JAEGER_API_URL}/services`);
    console.log('Jaeger services API status:', servicesResponse.status);
  }, 60000); // 60 second timeout for setup

  afterEach(async () => {
    // Clear any pending timers
    jest.clearAllTimers();

    // Force flush telemetry to clear any pending spans
    try {
      await flushTelemetry();
    } catch (error) {
      console.warn('Error flushing telemetry in afterEach:', error);
    }
  });

  afterAll(async () => {
    // Shutdown telemetry service with timeout
    try {
      const shutdownPromise = shutdownTelemetry();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error('Telemetry shutdown timeout')),
          10000
        );
      });

      await Promise.race([shutdownPromise, timeoutPromise]);
    } catch (error) {
      console.error('Error shutting down telemetry:', error);
    }

    // Stop Jaeger container
    try {
      execSync(`docker-compose -f "${DOCKER_COMPOSE_FILE}" down`, {
        stdio: 'inherit',
      });
    } catch (_error) {
      console.error('Error stopping Jaeger container:', _error);
    }
  }, 30000);

  describe('Span Creation and Export', () => {
    it('should create and export spans to Jaeger', async () => {
      const spanName = 'test-span-manual';
      const testAttributes = {
        'test.attribute': 'test-value',
        'test.number': 42,
      };

      // Create a span manually
      await withSpan(
        spanName,
        async () => {
          // Simulate some work
          await new Promise((resolve) => setTimeout(resolve, 100));
          return 'test-result';
        },
        testAttributes
      );

      // Force flush spans to ensure they're sent to Jaeger
      await flushTelemetry();

      // Wait longer for Jaeger to process and index the spans
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Verify span exists in Jaeger
      const spans = await getSpansFromJaeger(TEST_SERVICE_NAME, spanName);
      expect(spans.length).toBeGreaterThan(0);

      const span = spans[0];
      expect(span.operationName).toBe(spanName);
      expect(span.process.serviceName).toBe(TEST_SERVICE_NAME);

      // Verify attributes
      const tags = span.tags || [];
      const testAttrTag = tags.find((tag: any) => tag.key === 'test.attribute');
      expect(testAttrTag?.value).toBe('test-value');
    }, 15000);

    it('should create spans using the Traced decorator', async () => {
      class TestService {
        @Traced('decorated-method-span')
        async decoratedMethod(input: string): Promise<string> {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return `processed-${input}`;
        }
      }

      const service = new TestService();
      const result = await service.decoratedMethod('test-input');
      expect(result).toBe('processed-test-input');

      // Force flush spans to ensure they're sent to Jaeger
      await flushTelemetry();

      // Wait a bit for Jaeger to process the spans
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Verify span exists in Jaeger
      const spans = await getSpansFromJaeger(
        TEST_SERVICE_NAME,
        'decorated-method-span'
      );
      expect(spans.length).toBeGreaterThan(0);

      const span = spans[0];
      expect(span.operationName).toBe('decorated-method-span');
      expect(span.process.serviceName).toBe(TEST_SERVICE_NAME);
    }, 15000);

    it('should create nested spans', async () => {
      const parentSpanName = 'parent-span';
      const childSpanName = 'child-span';

      await withSpan(parentSpanName, async () => {
        await withSpan(childSpanName, async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
        });
      });

      // Force flush spans to ensure they're sent to Jaeger
      await flushTelemetry();

      // Wait longer for Jaeger to process and index the spans
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Verify both spans exist
      const parentSpans = await getSpansFromJaeger(
        TEST_SERVICE_NAME,
        parentSpanName
      );
      const childSpans = await getSpansFromJaeger(
        TEST_SERVICE_NAME,
        childSpanName
      );

      expect(parentSpans.length).toBeGreaterThan(0);
      expect(childSpans.length).toBeGreaterThan(0);

      // Verify parent-child relationship
      const parentSpan = parentSpans[0];
      const childSpan = childSpans[0];

      // In OpenTelemetry, parent-child relationships are represented by:
      // 1. Same traceID
      // 2. Child span has parentSpanID pointing to parent's spanID
      expect(childSpan.traceID).toBe(parentSpan.traceID);

      // Check if child span has parent reference (may be in references or parentSpanID)
      const hasParentReference =
        (childSpan.references && childSpan.references.length > 0) ||
        (childSpan.parentSpanID &&
          childSpan.parentSpanID === parentSpan.spanID);

      expect(hasParentReference).toBe(true);
    }, 15000);
  });
});

// Helper functions
async function waitForJaeger(maxAttempts = 30): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`${JAEGER_API_URL}/services`);
      if (response.ok) {
        console.log('Jaeger is ready!');
        return;
      }
    } catch (_error) {
      // Jaeger not ready yet
    }

    console.log(`Waiting for Jaeger... (${i + 1}/${maxAttempts})`);
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  throw new Error('Jaeger failed to start within timeout period');
}

async function getSpansFromJaeger(
  serviceName: string,
  operationName?: string
): Promise<any[]> {
  try {
    console.log(
      `Querying Jaeger for service: ${serviceName}, operation: ${operationName}`
    );

    // Get traces for the specific service
    const tracesUrl = `${JAEGER_API_URL}/traces?service=${encodeURIComponent(serviceName)}&limit=100&lookback=1h`;
    console.log('Fetching traces for service from:', tracesUrl);
    const tracesResponse = await fetch(tracesUrl);

    if (!tracesResponse.ok) {
      console.error(
        `Failed to fetch traces: ${tracesResponse.status} ${tracesResponse.statusText}`
      );
      const errorText = await tracesResponse.text();
      console.error('Error response:', errorText);
      return [];
    }

    const tracesData = await tracesResponse.json();
    const traces = tracesData.data || [];
    console.log(`Found ${traces.length} traces`);

    // Extract all spans from all traces and attach process info
    const allSpans: any[] = [];
    for (const trace of traces) {
      if (trace.spans && trace.processes) {
        console.log(`Trace ${trace.traceID} has ${trace.spans.length} spans`);
        // Attach process information to each span
        const spansWithProcess = trace.spans.map((span: any) => ({
          ...span,
          process: trace.processes[span.processID] || {},
        }));
        allSpans.push(...spansWithProcess);
      }
    }

    console.log(`Total spans found: ${allSpans.length}`);
    if (allSpans.length > 0) {
      console.log(
        'Sample span operations:',
        allSpans.slice(0, 3).map((s) => s.operationName)
      );
    }

    // Filter by operation name if specified
    if (operationName) {
      const filtered = allSpans.filter(
        (span) => span.operationName === operationName
      );
      console.log(
        `Filtered spans for operation '${operationName}': ${filtered.length}`
      );
      return filtered;
    }

    return allSpans;
  } catch (error) {
    console.error('Error fetching spans from Jaeger:', error);
    return [];
  }
}
