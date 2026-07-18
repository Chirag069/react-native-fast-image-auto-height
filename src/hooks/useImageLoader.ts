import { useCallback, useEffect, useRef, useState } from 'react';
import type { OnLoadEvent } from '../types/events';
import { scheduleIdleTask } from '../utils/scheduleIdleTask';

export interface UseImageLoaderOptions {
  /**
   * Identity of the current source (its cache key). Changing it resets
   * the load lifecycle — essential for recycled list cells.
   */
  sourceKey: string | null;
  /** Number of load retries after the first failure. */
  retryCount: number;
  /** Delay between retries, in milliseconds. */
  retryDelay: number;
  /** Defer the load until the JS thread is idle. */
  lazy: boolean;
  onLoadStart?: () => void;
  onLoad?: (event: OnLoadEvent) => void;
  onError?: () => void;
  onLoadEnd?: () => void;
}

export interface UseImageLoaderResult {
  /** `false` while a lazy load is still deferred — render the placeholder. */
  shouldLoad: boolean;
  /**
   * Current attempt number. Used as a React `key` on the native image so a
   * retry remounts it and forces a fresh native load of the same URL.
   */
  attempt: number;
  /** The image finished loading successfully. */
  loaded: boolean;
  /** All attempts failed. */
  failed: boolean;
  /** Wire these to the native image; they wrap the user's callbacks. */
  handlers: {
    onLoadStart: () => void;
    onLoad: (event: OnLoadEvent) => void;
    onError: () => void;
    onLoadEnd: () => void;
  };
}

interface LoaderState {
  sourceKey: string | null;
  attempt: number;
  loaded: boolean;
  failed: boolean;
}

const freshState = (sourceKey: string | null): LoaderState => ({
  sourceKey,
  attempt: 0,
  loaded: false,
  failed: false,
});

/**
 * Owns the image load lifecycle: lazy deferral, remount-based retries with
 * delay, and load/failure state for transitions. Retries are transparent to
 * the caller — `onError`/`onLoadEnd` fire only after the final attempt, and
 * `onLoadStart` fires only for the first, so callers observe exactly one
 * logical load per source.
 *
 * Unmount-safe: pending retry timers and idle-task handles are cancelled.
 */
export function useImageLoader(options: UseImageLoaderOptions): UseImageLoaderResult {
  const { sourceKey, lazy } = options;

  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });

  const [state, setState] = useState<LoaderState>(() => freshState(sourceKey));
  if (state.sourceKey !== sourceKey) {
    // Render-phase reset: a recycled cell must not inherit attempt/failure
    // state from the previous item.
    setState(freshState(sourceKey));
  }

  const effectiveAttempt = state.sourceKey === sourceKey ? state.attempt : 0;
  const attemptRef = useRef(effectiveAttempt);
  useEffect(() => {
    attemptRef.current = effectiveAttempt;
  });

  const [idleReached, setIdleReached] = useState(!lazy);
  useEffect(() => {
    if (!lazy || idleReached) {
      return;
    }
    return scheduleIdleTask(() => setIdleReached(true));
  }, [lazy, idleReached]);

  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (retryTimerRef.current !== null) {
        clearTimeout(retryTimerRef.current);
      }
    },
    []
  );

  const onLoadStart = useCallback(() => {
    // Retried attempts are invisible to the caller: one logical load.
    if (attemptRef.current === 0) {
      optionsRef.current.onLoadStart?.();
    }
  }, []);

  const onLoad = useCallback((event: OnLoadEvent) => {
    setState((prev) =>
      prev.loaded ? prev : { ...prev, loaded: true, failed: false }
    );
    optionsRef.current.onLoad?.(event);
    optionsRef.current.onLoadEnd?.();
  }, []);

  const onError = useCallback(() => {
    const { retryCount: maxRetries, retryDelay: delay } = optionsRef.current;
    setState((prev) => {
      if (prev.attempt < maxRetries) {
        const failedKey = prev.sourceKey;
        const failedAttempt = prev.attempt;
        retryTimerRef.current = setTimeout(() => {
          retryTimerRef.current = null;
          setState((current) =>
            // Only advance if the same source is still on the same attempt.
            current.sourceKey === failedKey && current.attempt === failedAttempt
              ? { ...current, attempt: current.attempt + 1 }
              : current
          );
        }, Math.max(0, delay));
        return prev;
      }
      optionsRef.current.onError?.();
      optionsRef.current.onLoadEnd?.();
      return { ...prev, failed: true };
    });
  }, []);

  // onLoadEnd from the native side is intentionally swallowed: the wrapped
  // callbacks above emit exactly one logical onLoadEnd per source.
  const onLoadEnd = useCallback(() => {}, []);

  return {
    shouldLoad: idleReached,
    attempt: effectiveAttempt,
    loaded: state.loaded,
    failed: state.failed,
    handlers: { onLoadStart, onLoad, onError, onLoadEnd },
  };
}
