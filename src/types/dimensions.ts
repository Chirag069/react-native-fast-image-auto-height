/**
 * Dimension and size-resolution types.
 */

/** Intrinsic pixel dimensions of an image. */
export interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * The result of resolving an image's intrinsic size.
 * Delivered by `onSizeResolved` and `FastImage.prefetchSize()`.
 */
export interface ResolvedImageSize extends ImageDimensions {
  /** Intrinsic aspect ratio (`width / height`). */
  aspectRatio: number;
  /**
   * `true` when the size was served synchronously from the in-memory
   * aspect-ratio cache (no async work happened for this resolution).
   */
  fromCache: boolean;
}

/** Lifecycle of a size resolution. */
export type SizeResolutionStatus = 'idle' | 'resolving' | 'resolved' | 'failed';

/** Internal cache entry: intrinsic dimensions plus their derived ratio. */
export interface CachedImageSize extends ImageDimensions {
  aspectRatio: number;
}

/** Options accepted by size-resolution entry points. */
export interface ResolveSizeOptions {
  /** How many times to retry a failed size probe. Defaults to `0`. */
  retryCount?: number;
  /** Delay in milliseconds between size-probe retries. Defaults to `250`. */
  retryDelay?: number;
}
