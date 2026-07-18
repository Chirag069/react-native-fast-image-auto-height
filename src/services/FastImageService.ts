import type { Source, FastImageSource } from '../types/source';
import type { ResolveSizeOptions, ResolvedImageSize } from '../types/dimensions';
import { nativeFastImageStatics } from '../components/InternalFastImage';
import { ImageSizeService } from './ImageSizeService';

/**
 * Facade over the native FastImage static surface, plus the new
 * size-prefetch capability. The public `FastImage.*` statics delegate here
 * so components stay free of native concerns.
 */
export const FastImageService = {
  /** Preloads images into the native (Glide / SDWebImage) cache. */
  preload(sources: Source[]): void {
    nativeFastImageStatics.preload(sources);
  },

  /** Clears the native in-memory image cache. */
  clearMemoryCache(): Promise<void> {
    return nativeFastImageStatics.clearMemoryCache();
  },

  /** Clears the native on-disk image cache. */
  clearDiskCache(): Promise<void> {
    return nativeFastImageStatics.clearDiskCache();
  },

  /**
   * Warms the aspect-ratio cache for a source before it renders — the
   * single biggest practical win for FlashList/FlatList feeds. Resolve
   * sizes while data loads and every image mounts with its final height.
   */
  prefetchSize(
    source: FastImageSource,
    options?: ResolveSizeOptions
  ): Promise<ResolvedImageSize> {
    return ImageSizeService.resolve(source, options);
  },

  /** Clears the aspect-ratio (size) cache. Does not touch native caches. */
  clearSizeCache(): void {
    ImageSizeService.clearCache();
  },
};
