import { PixelRatio } from 'react-native';

/**
 * Derives the display height for a known width and intrinsic aspect ratio
 * (`width / height`), rounded to the device pixel grid to avoid blurry
 * half-pixel edges.
 *
 * Returns `undefined` when the inputs cannot produce a meaningful height,
 * so callers can leave layout untouched instead of rendering a 0-height box.
 */
export function calculateHeight(
  width: number | undefined,
  aspectRatio: number | undefined
): number | undefined {
  if (
    width === undefined ||
    aspectRatio === undefined ||
    !Number.isFinite(width) ||
    !Number.isFinite(aspectRatio) ||
    width <= 0 ||
    aspectRatio <= 0
  ) {
    return undefined;
  }
  return PixelRatio.roundToNearestPixel(width / aspectRatio);
}
