/**
 * Executes async tasks with bounded retries. Cancellation is intentionally
 * cooperative: the underlying size probes are not abortable, so unmounted
 * subscribers simply detach (handled by the hooks layer with stale guards)
 * while the shared request completes and still populates the cache — work
 * already paid for is never thrown away.
 */
export interface RetryOptions {
  /** Number of retries after the first failed attempt. */
  retryCount: number;
  /** Delay between attempts, in milliseconds. */
  retryDelay: number;
}

export class RequestManager {
  /**
   * Runs `task`, retrying up to `retryCount` times with `retryDelay`
   * between attempts. Rejects with the final error when all attempts fail.
   */
  async execute<T>(task: () => Promise<T>, options: RetryOptions): Promise<T> {
    const attempts = Math.max(0, Math.floor(options.retryCount)) + 1;
    const retryDelay = Math.max(0, options.retryDelay);

    let lastError: unknown;
    for (let attempt = 0; attempt < attempts; attempt++) {
      if (attempt > 0 && retryDelay > 0) {
        await delay(retryDelay);
      }
      try {
        return await task();
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Library-wide singleton used by the services layer. */
export const requestManager = new RequestManager();
