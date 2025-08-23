import { TelemetryService, telemetryService, Traced, withSpan } from '../otel';
import { trace, SpanStatusCode } from '@opentelemetry/api';

// Mock OpenTelemetry dependencies
jest.mock('@opentelemetry/sdk-node');
jest.mock('@opentelemetry/exporter-otlp-http');
jest.mock('@opentelemetry/auto-instrumentations-node');

describe('TelemetryService', () => {
  let service: TelemetryService;
  let mockTracer: any;
  let mockSpan: any;

  beforeEach(() => {
    service = new TelemetryService();

    // Mock span
    mockSpan = {
      setAttributes: jest.fn(),
      setStatus: jest.fn(),
      recordException: jest.fn(),
      end: jest.fn(),
      spanContext: jest.fn().mockReturnValue({
        spanId: 'mock-span-id-123',
        traceId: 'mock-trace-id-456',
        traceFlags: 1,
      }),
    };

    // Mock tracer
    mockTracer = {
      startSpan: jest.fn().mockReturnValue(mockSpan),
    };

    // Mock trace API
    jest.spyOn(trace, 'getTracer').mockReturnValue(mockTracer);
    jest.spyOn(trace, 'getActiveSpan').mockReturnValue(mockSpan);

    // Ensure the service uses the mocked tracer
    (service as any).tracer = mockTracer;
  });

  afterEach(async () => {
    jest.clearAllMocks();

    // Reset service state without calling shutdown in unit tests
    if (service) {
      (service as any).isInitialized = false;
      (service as any).sdk = null;
    }

    // Clear any pending timers
    jest.clearAllTimers();
  });

  afterAll(async () => {
    // Reset service state without calling shutdown in unit tests
    if (service) {
      (service as any).isInitialized = false;
      (service as any).sdk = null;
    }
  });

  describe('initialization', () => {
    it('should initialize with default configuration', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      service.initialize();

      expect(service.initialized).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        'OpenTelemetry initialized successfully'
      );

      consoleSpy.mockRestore();
    });

    it('should initialize with custom configuration', () => {
      const config = {
        serviceName: 'test-service',
        serviceVersion: '2.0.0',
        otlpEndpoint: 'http://test:4318/v1/traces',
        environment: 'test',
        enableAutoInstrumentation: false,
      };

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      service.initialize(config);

      expect(service.initialized).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        'OpenTelemetry initialized successfully'
      );

      consoleSpy.mockRestore();
    });

    it('should warn when initializing twice', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      service.initialize();
      service.initialize();

      expect(consoleSpy).toHaveBeenCalledWith(
        'TelemetryService already initialized'
      );

      consoleSpy.mockRestore();
    });

    it('should handle initialization errors', () => {
      const mockSDK = {
        start: jest.fn().mockImplementation(() => {
          throw new Error('Initialization failed');
        }),
      };

      const { NodeSDK } = require('@opentelemetry/sdk-node');
      NodeSDK.mockImplementation(() => mockSDK);

      expect(() => service.initialize()).toThrow('Initialization failed');
      expect(service.initialized).toBe(false);
    });
  });

  describe('shutdown', () => {
    it('should shutdown gracefully', async () => {
      const mockSDK = {
        start: jest.fn(),
        shutdown: jest.fn().mockResolvedValue(undefined),
      };

      const { NodeSDK } = require('@opentelemetry/sdk-node');
      NodeSDK.mockImplementation(() => mockSDK);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      service.initialize();
      await service.shutdown();

      expect(mockSDK.shutdown).toHaveBeenCalled();
      expect(service.initialized).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'OpenTelemetry shutdown successfully'
      );

      consoleSpy.mockRestore();
    });

    it('should handle shutdown errors', async () => {
      const mockSDK = {
        start: jest.fn(),
        shutdown: jest.fn().mockRejectedValue(new Error('Shutdown failed')),
      };

      const { NodeSDK } = require('@opentelemetry/sdk-node');
      NodeSDK.mockImplementation(() => mockSDK);

      service.initialize();

      await expect(service.shutdown()).rejects.toThrow('Shutdown failed');
    });
  });

  describe('span creation', () => {
    beforeEach(() => {
      service.initialize();
    });

    it('should create plugin spans with correct attributes', () => {
      const span = service.startPluginSpan('rugby-plugin', 'calculateScore', {
        matchId: '123',
        teamCount: 2,
      });

      expect(mockTracer.startSpan).toHaveBeenCalledWith(
        'plugin.rugby-plugin.calculateScore',
        {
          kind: expect.any(Number),
          attributes: {
            'plugin.id': 'rugby-plugin',
            'plugin.operation': 'calculateScore',
            matchId: '123',
            teamCount: 2,
          },
        }
      );
      expect(span).toBe(mockSpan);
    });

    it('should create engine spans with correct attributes', () => {
      const span = service.startEngineSpan('processMatch', {
        tournamentId: 'tour-123',
      });

      expect(mockTracer.startSpan).toHaveBeenCalledWith('engine.processMatch', {
        kind: expect.any(Number),
        attributes: {
          'engine.operation': 'processMatch',
          tournamentId: 'tour-123',
        },
      });
      expect(span).toBe(mockSpan);
    });
  });

  describe('instrumentation', () => {
    beforeEach(() => {
      service.initialize();
    });

    it('should instrument successful function execution', async () => {
      const testFn = jest.fn().mockResolvedValue('success');

      const result = await service.instrument('test-operation', testFn, {
        testAttr: 'value',
      });

      expect(result).toBe('success');
      expect(mockTracer.startSpan).toHaveBeenCalledWith('test-operation', {
        kind: expect.any(Number),
        attributes: { testAttr: 'value' },
      });
      expect(mockSpan.setStatus).toHaveBeenCalledWith({
        code: SpanStatusCode.OK,
      });
      expect(mockSpan.end).toHaveBeenCalled();
    });

    it('should instrument failed function execution', async () => {
      const error = new Error('Test error');
      const testFn = jest.fn().mockRejectedValue(error);

      await expect(
        service.instrument('test-operation', testFn)
      ).rejects.toThrow('Test error');

      expect(mockSpan.setStatus).toHaveBeenCalledWith({
        code: SpanStatusCode.ERROR,
        message: 'Test error',
      });
      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan.end).toHaveBeenCalled();
    });

    it('should instrument synchronous functions', async () => {
      const testFn = jest.fn().mockReturnValue('sync-result');

      const result = await service.instrument('sync-operation', testFn);

      expect(result).toBe('sync-result');
      expect(mockSpan.setStatus).toHaveBeenCalledWith({
        code: SpanStatusCode.OK,
      });
      expect(mockSpan.end).toHaveBeenCalled();
    });
  });

  describe('span utilities', () => {
    beforeEach(() => {
      service.initialize();
    });

    it('should add attributes to active span', () => {
      service.addAttributes({ key1: 'value1', key2: 42 });

      expect(mockSpan.setAttributes).toHaveBeenCalledWith({
        key1: 'value1',
        key2: 42,
      });
    });

    it('should record exceptions in active span', () => {
      const error = new Error('Test exception');

      service.recordException(error);

      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan.setStatus).toHaveBeenCalledWith({
        code: SpanStatusCode.ERROR,
        message: 'Test exception',
      });
    });

    it('should handle missing active span gracefully', () => {
      jest.spyOn(trace, 'getActiveSpan').mockReturnValue(undefined);

      expect(() => {
        service.addAttributes({ key: 'value' });
        service.recordException(new Error('test'));
      }).not.toThrow();
    });
  });

  describe('getTracer', () => {
    it('should return the tracer instance', () => {
      // Initialize service to set up the tracer
      service.initialize();
      const tracer = service.getTracer();
      expect(tracer).toBe(mockTracer);
    });
  });
});

describe('Traced decorator', () => {
  let mockService: jest.Mocked<TelemetryService>;

  beforeEach(() => {
    mockService = {
      instrument: jest.fn().mockImplementation((name, fn) => fn()),
    } as any;

    // Replace the telemetryService instance
    (telemetryService as any).instrument = mockService.instrument;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should instrument class methods', async () => {
    class TestClass {
      @Traced()
      async testMethod(arg: string): Promise<string> {
        return `processed-${arg}`;
      }
    }

    const instance = new TestClass();
    const result = await instance.testMethod('input');

    expect(result).toBe('processed-input');
    expect(mockService.instrument).toHaveBeenCalledWith(
      'TestClass.testMethod',
      expect.any(Function),
      {
        'method.class': 'TestClass',
        'method.name': 'testMethod',
      }
    );
  });

  it('should use custom span name when provided', async () => {
    class TestClass {
      @Traced('custom-span-name')
      async testMethod(): Promise<void> {
        // Method implementation
      }
    }

    const instance = new TestClass();
    await instance.testMethod();

    expect(mockService.instrument).toHaveBeenCalledWith(
      'custom-span-name',
      expect.any(Function),
      expect.any(Object)
    );
  });
});

describe('withSpan helper', () => {
  let mockService: jest.Mocked<TelemetryService>;

  beforeEach(() => {
    mockService = {
      instrument: jest.fn().mockImplementation((name, fn) => fn()),
    } as any;

    // Replace the telemetryService instance
    (telemetryService as any).instrument = mockService.instrument;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create span for function execution', async () => {
    const testFn = jest.fn().mockResolvedValue('result');

    const result = await withSpan('test-span', testFn, { attr: 'value' });

    expect(result).toBe('result');
    expect(mockService.instrument).toHaveBeenCalledWith('test-span', testFn, {
      attr: 'value',
    });
  });
});

describe('global telemetry service', () => {
  it('should export a singleton instance', () => {
    expect(telemetryService).toBeInstanceOf(TelemetryService);
  });
});
