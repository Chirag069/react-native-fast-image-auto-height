/**
 * Optional size-cache storage contract.
 *
 * v1 reads and writes the aspect-ratio cache in memory only
 * (`AspectRatioCache`). This interface describes the shape used by
 * `CacheManager`'s internal write-through hook when a storage backend is
 * installed.
 */
export interface SizeCacheStorage {
  /** Returns the persisted aspect ratio for a cache key, if any. */
  get(key: string): number | undefined | Promise<number | undefined>;
  /** Persists the aspect ratio for a cache key. */
  set(key: string, aspectRatio: number): void | Promise<void>;
  /** Removes every persisted entry. */
  clear(): void | Promise<void>;
}
