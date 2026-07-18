import type { ImageStyle } from 'react-native';

/**
 * Style keys that must stay on the image itself (not the wrapper) when the
 * layout requires a container — otherwise rounded corners would stop
 * clipping the bitmap.
 */
const IMAGE_DECORATION_KEYS = [
  'borderRadius',
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderBottomLeftRadius',
  'borderBottomRightRadius',
] as const;

type ImageDecorationKey = (typeof IMAGE_DECORATION_KEYS)[number];
export type ImageDecorationStyle = Pick<ImageStyle, ImageDecorationKey>;

/**
 * Extracts decoration styles (border radii) from a flattened image style so
 * they can be re-applied to the inner image when a container is needed for
 * placeholders or transitions.
 */
export function extractImageDecorationStyle(
  flatStyle: ImageStyle
): ImageDecorationStyle | undefined {
  let decoration: ImageDecorationStyle | undefined;
  for (const key of IMAGE_DECORATION_KEYS) {
    const value = flatStyle[key];
    if (value !== undefined) {
      decoration = decoration ?? {};
      decoration[key] = value;
    }
  }
  return decoration;
}
