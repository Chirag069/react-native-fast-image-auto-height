import type { CachedImageSize, ImageDimensions } from '../types/dimensions';
import { DEFAULT_ASPECT_RATIO_CACHE_SIZE } from '../constants';
import { MemoryCache } from './MemoryCache';

/**
 * In-memory `cache key -> aspect ratio` LRU store. Entries retain the
 * intrinsic dimensions the ratio was derived from so cache hits can report
 * full `ResolvedImageSize` payloads.
 *
 * Memory-only on purpose: a persisted ratio for a URL whose image was
 * replaced server-side (common on merchant CDNs) would produce wrong
 * layouts forever.
 */
export class AspectRatioCache {
  private readonly cache: MemoryCache<string, CachedImageSize>;

  constructor(maxEntries: number = DEFAULT_ASPECT_RATIO_CACHE_SIZE) {
    this.cache = new MemoryCache<string, CachedImageSize>(maxEntries);
  }

  get(key: string): CachedImageSize | undefined {
    return this.cache.get(key);
  }

  /**
   * Caches the aspect ratio for intrinsic dimensions. Invalid dimensions
   * are ignored so a bad probe can never poison the cache.
   */
  set(key: string, dimensions: ImageDimensions): CachedImageSize | undefined {
    const { width, height } = dimensions;
    if (
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      width <= 0 ||
      height <= 0
    ) {
      return undefined;
    }
    const entry: CachedImageSize = { width, height, aspectRatio: width / height };
    this.cache.set(key, entry);
    return entry;
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}
