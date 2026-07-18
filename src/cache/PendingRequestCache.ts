/**
 * Promise deduplication: when N callers ask for the same key concurrently,
 * the factory runs exactly once and every caller awaits the same promise.
 * Settled promises are evicted so failures can be retried later.
 */
export class PendingRequestCache<T> {
  private readonly pending = new Map<string, Promise<T>>();

  /**
   * Returns the in-flight promise for `key`, creating it via `factory`
   * only when no request is currently pending.
   */
  getOrCreate(key: string, factory: () => Promise<T>): Promise<T> {
    const existing = this.pending.get(key);
    if (existing) {
      return existing;
    }
    const request = factory().finally(() => {
      this.pending.delete(key);
    });
    this.pending.set(key, request);
    return request;
  }

  /** Whether a request for `key` is currently in flight. */
  has(key: string): boolean {
    return this.pending.has(key);
  }

  clear(): void {
    this.pending.clear();
  }

  get size(): number {
    return this.pending.size;
  }
}
