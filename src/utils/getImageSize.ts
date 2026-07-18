import { Image } from 'react-native';
import type { ImageDimensions } from '../types/dimensions';

/**
 * Promise wrapper around React Native's size probes.
 *
 * This is the ONLY place in the library allowed to touch `Image.getSize` /
 * `Image.getSizeWithHeaders` (enforced by lint). Everything else goes
 * through `ImageSizeService`, which layers caching, deduplication and
 * retries on top of this primitive.
 */
export function getImageSize(
  uri: string,
  headers?: Record<string, string>
): Promise<ImageDimensions> {
  return new Promise<ImageDimensions>((resolve, reject) => {
    const onSuccess = (width: number, height: number): void => {
      if (width > 0 && height > 0) {
        resolve({ width, height });
      } else {
        reject(
          new Error(`Image reported invalid dimensions ${width}x${height}: ${uri}`)
        );
      }
    };
    const onFailure = (error: unknown): void => {
      reject(
        error instanceof Error
          ? error
          : new Error(`Failed to get size for image: ${uri}`)
      );
    };

    if (headers && Object.keys(headers).length > 0) {
      Image.getSizeWithHeaders(uri, headers, onSuccess, onFailure);
    } else {
      Image.getSize(uri, onSuccess, onFailure);
    }
  });
}
