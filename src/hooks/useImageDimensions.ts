import { useCallback, useEffect, useRef, useState } from 'react';
import type { FastImageSource } from '../types/source';
import type {
  ImageDimensions,
  ResolveSizeOptions,
  ResolvedImageSize,
  SizeResolutionStatus,
} from '../types/dimensions';
import { ImageSizeService } from '../services/ImageSizeService';
import { createCacheKey } from '../utils/createCacheKey';

export interface UseImageDimensionsOptions extends ResolveSizeOptions {
  /** When `false`, no resolution work happens at all. Defaults to `true`. */
  enabled?: boolean;
  /** Notified exactly once per source when the intrinsic size is known. */
  onSizeResolved?: (result: ResolvedImageSize) => void;
}

export interface UseImageDimensionsResult {
  /** Intrinsic dimensions, or `null` while unresolved. */
  dimensions: ImageDimensions | null;
  /** Intrinsic aspect ratio (`width / height`), or `null` while unresolved. */
  aspectRatio: number | null;
  status: SizeResolutionStatus;
  /** `true` when the size was served synchronously from cache. */
  fromCache: boolean;
  /**
   * Feeds intrinsic dimensions observed elsewhere (FastImage's `onLoad`)
   * into the cache and settles this hook if it is still resolving.
   */
  reportDimensions: (dimensions: ImageDimensions) => void;
}

interface DimensionsState {
  key: string | null;
  result: ResolvedImageSize | null;
  status: SizeResolutionStatus;
}

function initialStateFor(
  source: FastImageSource | undefined,
  key: string | null,
  enabled: boolean
): DimensionsState {
  if (!enabled || source === undefined || key === null) {
    return { key, result: null, status: 'idle' };
  }
  const cached = ImageSizeService.resolveFromCache(source);
  return cached
    ? { key, result: cached, status: 'resolved' }
    : { key, result: null, status: 'resolving' };
}

/**
 * Resolves the intrinsic dimensions of an image source through
 * `ImageSizeService` (cache-first, deduplicated, retried).
 *
 * Safe for recycled list cells: results for a previous source are never
 * applied after the source changes, and no state is written after unmount.
 */
export function useImageDimensions(
  source: FastImageSource | undefined,
  options: UseImageDimensionsOptions = {}
): UseImageDimensionsResult {
  const { enabled = true, retryCount, retryDelay, onSizeResolved } = options;

  const key = source !== undefined ? createCacheKey(source) : null;

  // Latest values readable from stable callbacks without re-subscribing.
  // Synced in an effect (declared before the resolution effect below, so
  // it always runs first) to keep render pure.
  const sourceRef = useRef(source);
  const keyRef = useRef(key);
  const onSizeResolvedRef = useRef(onSizeResolved);
  useEffect(() => {
    sourceRef.current = source;
    keyRef.current = key;
    onSizeResolvedRef.current = onSizeResolved;
  });

  const [state, setState] = useState<DimensionsState>(() =>
    initialStateFor(source, key, enabled)
  );

  // Render-phase reset keeps recycled cells (FlashList) from showing the
  // previous item's dimensions for even a single frame.
  if (state.key !== key) {
    setState(initialStateFor(source, key, enabled));
  }

  const notifiedKeyRef = useRef<string | null>(null);
  const notify = useCallback((forKey: string, result: ResolvedImageSize) => {
    if (notifiedKeyRef.current !== forKey) {
      notifiedKeyRef.current = forKey;
      onSizeResolvedRef.current?.(result);
    }
  }, []);

  useEffect(() => {
    // Reading the ref here (not `source` directly) keeps the dependency
    // list keyed on the stable cache key: new object literals with the
    // same uri never re-trigger resolution. The sync effect above has
    // already run, so the ref is current for this key.
    const currentSource = sourceRef.current;
    if (!enabled || key === null || currentSource === undefined) {
      return;
    }

    const cached = ImageSizeService.resolveFromCache(currentSource);
    if (cached) {
      setState((prev) =>
        prev.key === key && prev.status === 'resolved'
          ? prev
          : { key, result: cached, status: 'resolved' }
      );
      notify(key, cached);
      return;
    }

    // Stale guard: the shared probe keeps running (and still populates the
    // cache) but a stale or unmounted subscriber never applies its result.
    let stale = false;
    setState((prev) =>
      prev.key === key && prev.status === 'resolving'
        ? prev
        : { key, result: null, status: 'resolving' }
    );

    ImageSizeService.resolve(currentSource, { retryCount, retryDelay }).then(
      (result) => {
        if (!stale) {
          setState({ key, result, status: 'resolved' });
          notify(key, result);
        }
      },
      () => {
        if (!stale) {
          setState((prev) =>
            // An onLoad report may have resolved us while the probe failed.
            prev.key === key && prev.status === 'resolved'
              ? prev
              : { key, result: null, status: 'failed' }
          );
        }
      }
    );

    return () => {
      stale = true;
    };
  }, [key, enabled, retryCount, retryDelay, notify]);

  const reportDimensions = useCallback(
    (dimensions: ImageDimensions) => {
      const currentSource = sourceRef.current;
      const currentKey = keyRef.current;
      if (currentSource === undefined || currentKey === null) {
        return;
      }
      const result = ImageSizeService.reportLoadedDimensions(
        currentSource,
        dimensions
      );
      if (result) {
        setState((prev) =>
          prev.key === currentKey && prev.status !== 'resolved'
            ? { key: currentKey, result, status: 'resolved' }
            : prev
        );
        notify(currentKey, result);
      }
    },
    [notify]
  );

  return {
    dimensions: state.result
      ? { width: state.result.width, height: state.result.height }
      : null,
    aspectRatio: state.result?.aspectRatio ?? null,
    status: state.status,
    fromCache: state.result?.fromCache ?? false,
    reportDimensions,
  };
}
