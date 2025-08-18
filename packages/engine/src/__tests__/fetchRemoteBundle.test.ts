import {
  fetchRemoteBundle,
  RemoteBundleFetcher,
} from '../remote/fetchRemoteBundle';
import { BundleDownloadError, BundleVerificationError } from '../errors';

// Mock node-fetch - define inline to avoid hoisting issues
jest.mock('node-fetch', () => jest.fn());

// Mock fs/promises - define the mock inline to avoid hoisting issues
jest.mock('fs', () => ({
  promises: {
    access: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn(),
    mkdir: jest.fn(),
    readdir: jest.fn(),
    unlink: jest.fn(),
    stat: jest.fn(),
    rmdir: jest.fn(),
    rename: jest.fn(),
  },
}));

// Get the mocked modules for use in tests
const mockFetch = require('node-fetch') as jest.MockedFunction<typeof fetch>;
const mockFs = require('fs').promises;

describe('fetchRemoteBundle', () => {
  const testContent = 'hello';
  const validHash =
    '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'; // SHA-256 of 'hello'

  const mockConfig = {
    url: 'https://example.com/bundle.js',
    expectedHash: validHash,
    cacheDir: '/tmp/ump-cache',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset all mocks to their default state
    mockFs.readFile.mockResolvedValue(testContent);
    mockFs.writeFile.mockResolvedValue(undefined);
    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.readdir.mockResolvedValue([]);
    mockFs.unlink.mockResolvedValue(undefined);
    mockFs.stat.mockResolvedValue({
      size: 1024,
      mtime: new Date(),
      isFile: () => true,
    } as any);
    mockFs.rmdir.mockResolvedValue(undefined);
    mockFs.rename.mockResolvedValue(undefined);
  });

  describe('successful operations', () => {
    it('should download and cache bundle successfully', async () => {
      // Mock cache miss
      mockFs.access.mockRejectedValue(new Error('ENOENT'));

      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('hello'),
        status: 200,
        statusText: 'OK',
      } as any);

      const result = await fetchRemoteBundle(mockConfig);

      expect(result.content).toBe('hello');
      expect(result.cached).toBe(false);
      expect(mockFetch).toHaveBeenCalledWith(
        mockConfig.url,
        expect.any(Object)
      );
    });

    it('should return cached bundle if valid', async () => {
      // Mock cache file exists and is valid
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue('hello');

      const result = await fetchRemoteBundle(mockConfig);

      expect(result.content).toBe('hello');
      expect(result.cached).toBe(true);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should reject tampered bundle with wrong hash', async () => {
      // Mock cache miss
      mockFs.access.mockRejectedValue(new Error('ENOENT'));

      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('tampered content'),
        status: 200,
        statusText: 'OK',
      } as any);

      await expect(fetchRemoteBundle(mockConfig)).rejects.toThrow(
        BundleVerificationError
      );
    });

    it('should handle HTTP errors', async () => {
      // Mock cache miss
      mockFs.access.mockRejectedValue(new Error('ENOENT'));

      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as any);

      await expect(fetchRemoteBundle(mockConfig)).rejects.toThrow(
        BundleDownloadError
      );
    });

    it('should handle network errors', async () => {
      // Mock cache miss
      mockFs.access.mockRejectedValue(new Error('ENOENT'));
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(fetchRemoteBundle(mockConfig)).rejects.toThrow(
        BundleDownloadError
      );
    });

    it('should handle timeout', async () => {
      // Mock cache miss
      mockFs.access.mockRejectedValue(new Error('ENOENT'));

      // Mock AbortController and AbortError
      const mockAbortController = {
        signal: { aborted: false },
        abort: jest.fn(),
      };

      global.AbortController = jest.fn(() => mockAbortController) as any;

      // Create a proper AbortError
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';

      mockFetch.mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => {
            mockAbortController.abort();
            reject(abortError);
          }, 500);
        });
      });

      await expect(
        fetchRemoteBundle({ ...mockConfig, timeout: 1000 })
      ).rejects.toThrow(/timeout/i);
    }, 15000);

    it('should handle invalid hash format', async () => {
      const invalidConfig = {
        ...mockConfig,
        expectedHash: 'invalid-hash',
      };

      await expect(fetchRemoteBundle(invalidConfig)).rejects.toThrow(
        /valid SHA-256 hash/
      );
    });

    it('should handle empty response', async () => {
      // Mock cache miss
      mockFs.access.mockRejectedValue(new Error('ENOENT'));

      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(''),
        status: 200,
        statusText: 'OK',
      } as any);

      await expect(fetchRemoteBundle(mockConfig)).rejects.toThrow(
        /Empty response/
      );
    });
  });

  describe('cache management', () => {
    let fetcher: RemoteBundleFetcher;

    beforeEach(() => {
      fetcher = new RemoteBundleFetcher();
    });

    it('should remove invalid cache files', async () => {
      // Mock cache hit with invalid content
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue('invalid cached content');

      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('hello'),
        status: 200,
        statusText: 'OK',
      } as any);

      const result = await fetchRemoteBundle(mockConfig);

      expect(result.content).toBe('hello');
      expect(mockFs.unlink).toHaveBeenCalled();
    });

    it('should clear cache directory', async () => {
      mockFs.readdir.mockResolvedValue(['file1.js', 'file2.js']);

      await fetcher.clearCache();

      expect(mockFs.rmdir).toHaveBeenCalledWith(fetcher['cacheDir'], {
        recursive: true,
      });
    });

    it('should get cache statistics', async () => {
      mockFs.readdir.mockResolvedValue(['file1.js', 'file2.js']);
      mockFs.stat.mockResolvedValue({
        size: 1024,
        mtime: new Date(),
        isFile: () => true,
      } as any);

      const stats = await fetcher.getCacheStats();

      expect(stats.files).toBe(2);
      expect(stats.totalSize).toBe(2048);
      expect(mockFs.readdir).toHaveBeenCalledWith(fetcher['cacheDir']);
      expect(mockFs.stat).toHaveBeenCalledTimes(2);
    });
  });
});
