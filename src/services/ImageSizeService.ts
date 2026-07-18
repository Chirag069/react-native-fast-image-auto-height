import type { FastImageSource } from '../types/source';
import type {
  ImageDimensions,
  ResolveSizeOptions,
  ResolvedImageSize,
} from '../types/dimensions';
import { DEFAULT_RETRY_COUNT, DEFAULT_RETRY_DELAY } from '../constants';
import { cacheManager } from '../managers/CacheManager';
import { requestManager } from '../managers/RequestManager';
import { createCacheKey } from '../utils/createCacheKey';
import { getImageSize } from '../utils/getImageSize';
import { resolveAsset } from '../utils/resolveAsset';

/**
 * The single entry point for intrinsic image-size resolution.
 *
 * Nothing else in the library (and nothing in apps built on it) should ever
 * call `Image.getSize` directly — this service layers on top of the raw
 * probe, in priority order:
 *
 * 1. Synchronous memory-cache hit (zero cost, no layout jump).
 * 2. Synchronous local-asset resolution (`require(...)` never probes).
 * 3. Deduplicated, retried async probe — 100 concurrent requests for the
 *    same URL execute exactly one `Image.getSize` call.
 *
 * FastImage's own `onLoad` dimensions are harvested for free through
 * {@link ImageSizeService.reportLoadedDimensions}, so images that render
 * before a probe finishes still populate the cache without extra work.
 */
class ImageSizeServiceImpl {
  /**
   * Synchronous fast path. Returns the resolved size when it is knowable
   * without async work (memory-cache hit or local asset), else `null`.
   */
  resolveFromCache(source: FastImageSource): ResolvedImageSize | null {
    const key = createCacheKey(source);
    if (key === null) {
      return null;
    }

    const cached = cacheManager.getSize(key);
    if (cached) {
      return { ...cached, fromCache: true };
    }

    if (typeof source === 'number') {
      const dimensions = resolveAsset(source);
      if (dimensions) {
        const entry = cacheManager.setSize(key, dimensions);
        if (entry) {
          return { ...entry, fromCache: true };
        }
      }
    }

    return null;
  }

  /**
   * Resolves the intrinsic size of any source. Concurrent calls for the
   * same source share one in-flight probe; results are cached in memory.
   */
  async resolve(
    source: FastImageSource,
    options?: ResolveSizeOptions
  ): Promise<ResolvedImageSize> {
    const fromCache = this.resolveFromCache(source);
    if (fromCache) {
      return fromCache;
    }

    const key = createCacheKey(source);
    if (key === null || typeof source === 'number' || !source.uri) {
      throw new Error(
        'Cannot resolve image size: source has no uri or is an unresolvable local asset.'
      );
    }

    const { uri, headers } = source;
    const retryCount = options?.retryCount ?? DEFAULT_RETRY_COUNT;
    const retryDelay = options?.retryDelay ?? DEFAULT_RETRY_DELAY;

    const dimensions = await cacheManager.dedupe(key, () =>
      requestManager.execute(() => getImageSize(uri, headers), {
        retryCount,
        retryDelay,
      })
    );

    // A concurrent onLoad report may have already cached this key; setSize
    // simply overwrites with identical data, so ordering does not matter.
    const entry = cacheManager.setSize(key, dimensions);
    if (!entry) {
      throw new Error(
        `Image size probe returned invalid dimensions for: ${uri}`
      );
    }
    return { ...entry, fromCache: false };
  }

  /**
   * Harvests intrinsic dimensions delivered by FastImage's `onLoad` event.
   * This is free cache population: the image already loaded through the
   * native pipeline, so no probe is ever needed for this source again.
   */
  reportLoadedDimensions(
    source: FastImageSource,
    dimensions: ImageDimensions
  ): ResolvedImageSize | null {
    const key = createCacheKey(source);
    if (key === null) {
      return null;
    }
    const entry = cacheManager.setSize(key, dimensions);
    return entry ? { ...entry, fromCache: false } : null;
  }

  /** Clears every cached size (memory and installed persistent backend). */
  clearCache(): void {
    cacheManager.clear();
  }
}

/** Singleton — all size resolution flows through this instance. */
export const ImageSizeService = new ImageSizeServiceImpl();
