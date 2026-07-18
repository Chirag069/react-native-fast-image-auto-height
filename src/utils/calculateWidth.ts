import { PixelRatio } from 'react-native';

/**
 * Derives the display width for a known height and intrinsic aspect ratio
 * (`width / height`), rounded to the device pixel grid.
 *
 * Returns `undefined` when the inputs cannot produce a meaningful width.
 */
export function calculateWidth(
  height: number | undefined,
  aspectRatio: number | undefined
): number | undefined {
  if (
    height === undefined ||
    aspectRatio === undefined ||
    !Number.isFinite(height) ||
    !Number.isFinite(aspectRatio) ||
    height <= 0 ||
    aspectRatio <= 0
  ) {
    return undefined;
  }
  return PixelRatio.roundToNearestPixel(height * aspectRatio);
}
