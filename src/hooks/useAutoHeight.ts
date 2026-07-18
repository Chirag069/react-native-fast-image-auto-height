import { useMemo } from 'react';
import { calculateHeight } from '../utils/calculateHeight';

export interface UseAutoHeightParams {
  /** When `false`, the hook returns `undefined` and does no work. */
  enabled: boolean;
  /** The known display width (from style or layout measurement). */
  width: number | undefined;
  /** The intrinsic aspect ratio, once resolved. */
  aspectRatio: number | null | undefined;
  /** Provisional ratio used until the intrinsic one is known. */
  estimatedAspectRatio?: number;
}

/**
 * Derives a display height from a width and an aspect ratio, preferring
 * the intrinsic ratio and falling back to the caller's estimate so layout
 * can settle before resolution completes.
 */
export function useAutoHeight({
  enabled,
  width,
  aspectRatio,
  estimatedAspectRatio,
}: UseAutoHeightParams): number | undefined {
  return useMemo(() => {
    if (!enabled) {
      return undefined;
    }
    return calculateHeight(width, aspectRatio ?? estimatedAspectRatio);
  }, [enabled, width, aspectRatio, estimatedAspectRatio]);
}
