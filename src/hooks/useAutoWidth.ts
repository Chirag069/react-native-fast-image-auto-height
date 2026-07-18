import { useMemo } from 'react';
import { calculateWidth } from '../utils/calculateWidth';

export interface UseAutoWidthParams {
  /** When `false`, the hook returns `undefined` and does no work. */
  enabled: boolean;
  /** The known display height (from style or layout measurement). */
  height: number | undefined;
  /** The intrinsic aspect ratio, once resolved. */
  aspectRatio: number | null | undefined;
  /** Provisional ratio used until the intrinsic one is known. */
  estimatedAspectRatio?: number;
}

/**
 * Derives a display width from a height and an aspect ratio, preferring
 * the intrinsic ratio and falling back to the caller's estimate.
 */
export function useAutoWidth({
  enabled,
  height,
  aspectRatio,
  estimatedAspectRatio,
}: UseAutoWidthParams): number | undefined {
  return useMemo(() => {
    if (!enabled) {
      return undefined;
    }
    return calculateWidth(height, aspectRatio ?? estimatedAspectRatio);
  }, [enabled, height, aspectRatio, estimatedAspectRatio]);
}
