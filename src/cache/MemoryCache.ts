/**
 * A minimal, dependency-free LRU cache built on `Map`'s insertion-order
 * guarantee: reads re-insert the entry (making it most-recent), and writes
 * beyond capacity evict the oldest entry.
 *
 * All operations are O(1).
 */
export class MemoryCache<K, V> {
  private readonly entries = new Map<K, V>();

  constructor(private readonly maxEntries: number) {
    if (!Number.isInteger(maxEntries) || maxEntries <= 0) {
      throw new Error(`MemoryCache maxEntries must be a positive integer, got ${maxEntries}`);
    }
  }

  /** Returns the cached value and marks it most-recently used. */
  get(key: K): V | undefined {
    if (!this.entries.has(key)) {
      return undefined;
    }
    const value = this.entries.get(key) as V;
    this.entries.delete(key);
    this.entries.set(key, value);
    return value;
  }

  /** Returns whether a key is cached without touching recency. */
  has(key: K): boolean {
    return this.entries.has(key);
  }

  /** Stores a value, evicting the least-recently-used entry when full. */
  set(key: K, value: V): void {
    if (this.entries.has(key)) {
      this.entries.delete(key);
    } else if (this.entries.size >= this.maxEntries) {
      const oldestKey = this.entries.keys().next().value as K;
      this.entries.delete(oldestKey);
    }
    this.entries.set(key, value);
  }

  delete(key: K): boolean {
    return this.entries.delete(key);
  }

  clear(): void {
    this.entries.clear();
  }

  get size(): number {
    return this.entries.size;
  }
}
