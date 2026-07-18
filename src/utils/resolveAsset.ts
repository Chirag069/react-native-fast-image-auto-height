import { Image } from 'react-native';
import type { ImageDimensions } from '../types/dimensions';

/**
 * Resolves the intrinsic dimensions of a local asset (`require('./img.png')`)
 * synchronously through the packager's asset registry. Local assets never
 * require an async probe.
 *
 * Returns `null` when the asset cannot be resolved (unknown id, or an asset
 * registered without dimensions).
 */
export function resolveAsset(asset: number): ImageDimensions | null {
  const resolved = Image.resolveAssetSource(asset);
  if (
    !resolved ||
    typeof resolved.width !== 'number' ||
    typeof resolved.height !== 'number' ||
    resolved.width <= 0 ||
    resolved.height <= 0
  ) {
    return null;
  }
  return { width: resolved.width, height: resolved.height };
}
