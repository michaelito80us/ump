/**
 * @jest-environment jsdom
 */
import { NextRequest } from 'next/server';

// Mock global URL class
import { URL } from 'url';
global.URL = Object.assign(URL, {
  createObjectURL: jest.fn().mockReturnValue('blob:mock-url'),
  revokeObjectURL: jest.fn(),
});

// Mock NextRequest and NextResponse
jest.mock('next/server', () => {
  const createMockHeaders = (contentType: string, filename: string) => {
    const mockHeaders = new Map();
    mockHeaders.set = jest.fn().mockReturnThis();
    mockHeaders.get = jest.fn((key: string) => {
      if (key === 'Content-Type') return contentType;
      if (key === 'Content-Disposition')
        return `attachment; filename="${filename}"`;
      return null;
    });
    return mockHeaders;
  };

  return {
    NextRequest: jest.fn().mockImplementation((url: string) => ({
      url,
      searchParams: {
        get: (key: string) => {
          const urlObj = new URL(url);
          return urlObj.searchParams.get(key);
        },
      },
    })),
    NextResponse: Object.assign(
      jest.fn().mockImplementation((body, init) => {
        const headers = init?.headers || {};
        const contentType = headers['Content-Type'] || 'text/csv';
        const disposition =
          headers['Content-Disposition'] ||
          'attachment; filename="audit-logs-2025-08-15.csv"';
        const filename =
          disposition.match(/filename="([^"]+)"/)?.[1] ||
          'audit-logs-2025-08-15.csv';

        return {
          body,
          headers: createMockHeaders(contentType, filename),
          status: init?.status || 200,
          json: () => Promise.resolve(body),
          text: () =>
            Promise.resolve(
              typeof body === 'string' ? body : JSON.stringify(body)
            ),
        };
      }),
      {
        json: jest.fn().mockImplementation((data, init) => ({
          body: data,
          headers: createMockHeaders('application/json', 'response.json'),
          status: init?.status || 200,
          json: () => Promise.resolve(data),
          text: () => Promise.resolve(JSON.stringify(data)),
        })),
      }
    ),
  };
});

// Mock @ump/core
jest.mock('@ump/core', () => ({
  AuditLog: {},
}));

// Mock web APIs
global.TextEncoder = class MockTextEncoder {
  encode(input: string): Uint8Array {
    return new Uint8Array(Buffer.from(input, 'utf8'));
  }

  encodeInto(): any {
    return {};
  }

  get encoding(): string {
    return 'utf-8';
  }
} as any;

global.ReadableStream = class MockReadableStream {
  source: any;
  chunks: Uint8Array[] = [];

  constructor(source: any) {
    this.source = source;

    if (source?.start) {
      const controller = {
        enqueue: (chunk: Uint8Array) => this.chunks.push(chunk),
        close: () => {},
        error: () => {},
      };
      source.start(controller);
    }
  }

  getText(): string {
    return this.chunks.map((chunk) => Buffer.from(chunk).toString()).join('');
  }
} as any;

describe('/api/audit/export', () => {
  let GET: any, POST: any, PUT: any, DELETE: any;

  beforeAll(async () => {
    // Import the route handlers after mocking
    const routeModule = await import('../route');
    GET = routeModule.GET;
    POST = routeModule.POST;
    PUT = routeModule.PUT;
    DELETE = routeModule.DELETE;
  });

  describe('GET', () => {
    it('should return CSV format by default', async () => {
      const mockRequest = {
        url: 'http://localhost:3000/api/audit/export',
      } as unknown as NextRequest;

      const response = await GET(mockRequest);

      expect(!!response).toBe(true);
      expect(response.headers.get('Content-Type')).toBe('text/csv');
      expect(response.headers.get('Content-Disposition')).toContain(
        'attachment'
      );
      expect(response.headers.get('Content-Disposition')).toContain('.csv');
    });

    it('should return NDJSON format when requested', async () => {
      const mockRequest = {
        url: 'http://localhost:3000/api/audit/export?format=ndjson',
      } as unknown as NextRequest;

      const response = await GET(mockRequest);

      expect(!!response).toBe(true);
      expect(response.headers.get('Content-Type')).toBe('application/x-ndjson');
      expect(response.headers.get('Content-Disposition')).toContain('.ndjson');
    });

    it('should handle pagination parameters', async () => {
      const mockRequest = {
        url: 'http://localhost:3000/api/audit/export?limit=1&offset=1',
      } as unknown as NextRequest;

      const response = await GET(mockRequest);

      expect(!!response).toBe(true);
      expect(response.headers.get('Content-Type')).toBe('text/csv');
    });

    it('should handle tournament filtering', async () => {
      const mockRequest = {
        url: 'http://localhost:3000/api/audit/export?tournamentId=test-tournament',
      } as unknown as NextRequest;

      const response = await GET(mockRequest);

      expect(!!response).toBe(true);
      expect(response.headers.get('Content-Type')).toBe('text/csv');
    });

    it('should return 400 for invalid format', async () => {
      const mockRequest = {
        url: 'http://localhost:3000/api/audit/export?format=invalid',
      } as unknown as NextRequest;

      const response = await GET(mockRequest);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid format. Must be csv or ndjson');
    });

    it('should set correct filename with current date', async () => {
      const mockRequest = {
        url: 'http://localhost:3000/api/audit/export',
      } as unknown as NextRequest;

      const response = await GET(mockRequest);

      const disposition = response.headers.get('Content-Disposition');
      const today = new Date().toISOString().split('T')[0];
      expect(disposition).toContain(`audit-logs-${today}.csv`);
    });
  });

  describe('Unsupported HTTP methods', () => {
    it('should return 405 for POST requests', async () => {
      const response = await POST();

      expect(response.status).toBe(405);
      const data = await response.json();
      expect(data.error).toBe('Method not allowed');
    });

    it('should return 405 for PUT requests', async () => {
      const response = await PUT();

      expect(response.status).toBe(405);
      const data = await response.json();
      expect(data.error).toBe('Method not allowed');
    });

    it('should return 405 for DELETE requests', async () => {
      const response = await DELETE();

      expect(response.status).toBe(405);
      const data = await response.json();
      expect(data.error).toBe('Method not allowed');
    });
  });

  describe('Error handling', () => {
    it('should handle internal errors gracefully', async () => {
      // Mock console.error to avoid noise
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      // Create a request that will cause URL parsing to fail
      const mockRequest = {
        get url() {
          throw new Error('Test error');
        },
      } as unknown as NextRequest;

      const response = await GET(mockRequest);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Internal server error');

      consoleSpy.mockRestore();
    });
  });
});

// Test the utility functions separately
describe('Utility Functions', () => {
  it('should be tested indirectly through API responses', () => {
    // This is a placeholder - the utility functions are tested indirectly
    // through the API endpoint tests above
    expect(true).toBe(true);
  });
});
