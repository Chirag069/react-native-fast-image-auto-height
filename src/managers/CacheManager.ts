import { AspectRatioCache } from '../cache/AspectRatioCache';
import { PendingRequestCache } from '../cache/PendingRequestCache';
import type { SizeCacheStorage } from '../types/cache';
import type { CachedImageSize, ImageDimensions } from '../types/dimensions';

/**
 * Facade over the cache layer. Owns the in-memory aspect-ratio LRU, the
 * pending-request deduplication map, and the optional pluggable persistent
 * storage.
 *
 * Version 1 reads exclusively from memory (see AspectRatioCache for why);
 * an installed {@link SizeCacheStorage} receives write-through updates so
 * persistence plugins (MMKV, AsyncStorage) can be layered on without a
 * public API change.
 */
export class CacheManager {
  private readonly sizes: AspectRatioCache;
  private readonly pending = new PendingRequestCache<ImageDimensions>();
  private storage: SizeCacheStorage | null = null;

  constructor(maxEntries?: number) {
    this.sizes = new AspectRatioCache(maxEntries);
  }

  /** Synchronous memory-cache lookup. */
  getSize(key: string): CachedImageSize | undefined {
    return this.sizes.get(key);
  }

  /**
   * Stores intrinsic dimensions and write-throughs the derived ratio to the
   * installed persistent storage, if any. Returns the cache entry, or
   * `undefined` when the dimensions were invalid.
   */
  setSize(key: string, dimensions: ImageDimensions): CachedImageSize | undefined {
    const entry = this.sizes.set(key, dimensions);
    if (entry && this.storage) {
      // Fire-and-forget: persistence must never block or fail a resolution.
      try {
        void Promise.resolve(
          this.storage.set(key, entry.aspectRatio)
        ).catch(() => undefined);
      } catch {
        // Synchronous storage failures are ignored for the same reason.
      }
    }
    return entry;
  }

  /** Deduplicates concurrent async work per cache key. */
  dedupe(
    key: string,
    factory: () => Promise<ImageDimensions>
  ): Promise<ImageDimensions> {
    return this.pending.getOrCreate(key, factory);
  }

  /** Whether a size probe for `key` is currently in flight. */
  isPending(key: string): boolean {
    return this.pending.has(key);
  }

  /** Installs (or removes, with `null`) a persistent storage backend. */
  setStorage(storage: SizeCacheStorage | null): void {
    this.storage = storage;
  }

  /** Clears the in-memory cache and the persistent backend, if installed. */
  clear(): void {
    this.sizes.clear();
    if (this.storage) {
      try {
        void Promise.resolve(this.storage.clear()).catch(() => undefined);
      } catch {
        // Ignored: cache clearing must never throw into callers.
      }
    }
  }

  get sizeCacheEntryCount(): number {
    return this.sizes.size;
  }
}

/** Library-wide singleton used by the services layer. */
export const cacheManager = new CacheManager();
