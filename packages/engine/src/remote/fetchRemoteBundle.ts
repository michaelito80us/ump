import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import fetch from 'node-fetch';
import {
  RemoteBundleError,
  BundleVerificationError,
  BundleDownloadError,
  BundleCacheError,
} from '../errors';

// Re-export error classes for convenience
export {
  RemoteBundleError,
  BundleVerificationError,
  BundleDownloadError,
  BundleCacheError,
} from '../errors';

export interface RemoteBundleConfig {
  url: string;
  expectedHash: string;
  cacheDir?: string;
  timeout?: number;
}

export interface BundleResult {
  content: string;
  hash: string;
  cached: boolean;
  path: string;
}

/**
 * Securely fetches and verifies remote plugin bundles with SHA-256 verification
 * and local caching for performance.
 */
export class RemoteBundleFetcher {
  private readonly cacheDir: string;
  private readonly timeout: number;

  constructor(cacheDir?: string, timeout: number = 30000) {
    this.cacheDir = cacheDir || join(tmpdir(), 'ump-plugin-cache');
    this.timeout = timeout;
  }

  /**
   * Fetches a remote bundle with SHA-256 verification and caching
   */
  async fetchBundle(config: RemoteBundleConfig): Promise<BundleResult> {
    const { url, expectedHash, cacheDir = this.cacheDir } = config;

    // Validate inputs
    if (!url || !expectedHash) {
      throw new RemoteBundleError('URL and expectedHash are required');
    }

    // Validate SHA-256 hash format (64 hexadecimal characters)
    if (!/^[a-f0-9]{64}$/i.test(expectedHash)) {
      throw new RemoteBundleError(
        'expectedHash must be a valid SHA-256 hash (64 hexadecimal characters)'
      );
    }

    const cachePath = this.getCachePath(url, expectedHash, cacheDir);

    // Try to load from cache first
    try {
      const cachedContent = await this.loadFromCache(cachePath);
      if (cachedContent) {
        const hash = this.calculateHash(cachedContent);
        if (hash === expectedHash) {
          return {
            content: cachedContent,
            hash,
            cached: true,
            path: cachePath,
          };
        }
        // Cache is invalid, remove it
        await fs.unlink(cachePath).catch(() => {});
      }
    } catch {
      // Cache read failed, continue with download
    }

    // Download from remote
    const content = await this.downloadBundle(url, config.timeout);

    // Verify hash
    const actualHash = this.calculateHash(content);
    if (actualHash !== expectedHash) {
      throw new BundleVerificationError(expectedHash, actualHash);
    }

    // Cache the bundle
    await this.cacheBundle(cachePath, content);

    return {
      content,
      hash: actualHash,
      cached: false,
      path: cachePath,
    };
  }

  /**
   * Downloads bundle content from remote URL
   */
  private async downloadBundle(url: string, timeout?: number): Promise<string> {
    try {
      const controller = new globalThis.AbortController();
      const timeoutId = timeout
        ? setTimeout(() => controller.abort(), timeout)
        : null;

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'UMP-Engine/1.0',
        },
      });

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        throw new BundleDownloadError(
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const content = await response.text();
      if (!content) {
        throw new BundleDownloadError('Empty response from server');
      }

      return content;
    } catch (err) {
      const error = err as Error;
      if (error.name === 'AbortError') {
        throw new BundleDownloadError(`Request timeout after ${timeout}ms`);
      }
      throw new BundleDownloadError(
        `Failed to download bundle: ${error.message}`
      );
    }
  }

  /**
   * Loads bundle from cache if it exists
   */
  private async loadFromCache(cachePath: string): Promise<string | null> {
    try {
      await fs.access(cachePath);
      return await fs.readFile(cachePath, 'utf8');
    } catch {
      return null;
    }
  }

  /**
   * Calculates SHA-256 hash of content
   */
  private calculateHash(content: string): string {
    return createHash('sha256').update(content, 'utf8').digest('hex');
  }

  /**
   * Generates cache file path based on URL and hash
   */
  private getCachePath(
    url: string,
    expectedHash: string,
    cacheDir: string
  ): string {
    const urlHash = createHash('sha256')
      .update(url, 'utf8')
      .digest('hex')
      .substring(0, 16);
    const filename = `${urlHash}-${expectedHash.substring(0, 16)}.js`;
    return join(cacheDir, filename);
  }

  /**
   * Caches bundle content to disk
   */
  private async cacheBundle(cachePath: string, content: string): Promise<void> {
    try {
      // Ensure cache directory exists
      await fs.mkdir(join(cachePath, '..'), { recursive: true });

      // Write to temporary file first, then rename for atomic operation
      const tempPath = `${cachePath}.tmp`;
      await fs.writeFile(tempPath, content, 'utf8');
      await fs.rename(tempPath, cachePath);
    } catch (err) {
      const error = err as Error;
      throw new BundleCacheError(`Failed to cache bundle: ${error.message}`);
    }
  }

  /**
   * Clears the entire cache directory
   */
  async clearCache(): Promise<void> {
    try {
      await fs.rmdir(this.cacheDir, { recursive: true });
    } catch (err) {
      const error = err as Error & { code?: string };
      // Ignore if directory doesn't exist
      if (error.code !== 'ENOENT') {
        throw new BundleCacheError(`Failed to clear cache: ${error.message}`);
      }
    }
  }

  /**
   * Gets cache statistics
   */
  async getCacheStats(): Promise<{ files: number; totalSize: number }> {
    try {
      const files = await fs.readdir(this.cacheDir);
      let totalSize = 0;

      for (const file of files) {
        const filePath = join(this.cacheDir, file);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
      }

      return { files: files.length, totalSize };
    } catch {
      return { files: 0, totalSize: 0 };
    }
  }
}

/**
 * Convenience function for fetching remote bundles
 */
export async function fetchRemoteBundle(
  config: RemoteBundleConfig
): Promise<BundleResult> {
  const fetcher = new RemoteBundleFetcher(config.cacheDir, config.timeout);
  return fetcher.fetchBundle(config);
}
