/**
 * Schedules a callback for when the JS thread is idle, returning a cancel
 * function. Uses `requestIdleCallback` (React Native's recommended
 * replacement for the deprecated `InteractionManager`) and falls back to a
 * macrotask on runtimes without it, so `lazy` never blocks rendering work.
 */

interface IdleCapableGlobal {
  requestIdleCallback?: (callback: () => void) => number;
  cancelIdleCallback?: (handle: number) => void;
}

export function scheduleIdleTask(callback: () => void): () => void {
  const idleGlobal = globalThis as IdleCapableGlobal;

  if (
    typeof idleGlobal.requestIdleCallback === 'function' &&
    typeof idleGlobal.cancelIdleCallback === 'function'
  ) {
    const handle = idleGlobal.requestIdleCallback(callback);
    return () => idleGlobal.cancelIdleCallback?.(handle);
  }

  const handle = setTimeout(callback, 0);
  return () => clearTimeout(handle);
}
