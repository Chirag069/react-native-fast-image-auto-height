/**
 * Pluggable cache contracts.
 *
 * Version 1 ships with an in-memory LRU only (a replaced image behind an
 * unchanged URL must never be served stale persisted dimensions). Persistent
 * backends (MMKV, AsyncStorage, ...) plug in through this interface via
 * `CacheManager.setStorage()` without any public API change.
 */
export interface SizeCacheStorage {
  /** Returns the persisted aspect ratio for a cache key, if any. */
  get(key: string): number | undefined | Promise<number | undefined>;
  /** Persists the aspect ratio for a cache key. */
  set(key: string, aspectRatio: number): void | Promise<void>;
  /** Removes every persisted entry. */
  clear(): void | Promise<void>;
}
