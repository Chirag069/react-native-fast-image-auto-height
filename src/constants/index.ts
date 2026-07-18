import type {
  ResizeMode,
  Priority,
  CacheControlMode,
  NativeTransition,
} from '../types/source';

/**
 * FastImage-compatible enums. Values are identical to
 * `@d11/react-native-fast-image` so migration is import-only.
 */
export const resizeMode: Record<ResizeMode, ResizeMode> = {
  contain: 'contain',
  cover: 'cover',
  stretch: 'stretch',
  center: 'center',
} as const;

export const priority: Record<Priority, Priority> = {
  low: 'low',
  normal: 'normal',
  high: 'high',
} as const;

export const cacheControl: Record<CacheControlMode, CacheControlMode> = {
  immutable: 'immutable',
  web: 'web',
  cacheOnly: 'cacheOnly',
} as const;

export const transition: Record<NativeTransition, NativeTransition> = {
  fade: 'fade',
  none: 'none',
} as const;

/**
 * Maximum number of URL -> aspect-ratio entries kept in memory.
 * Each entry is a short string key plus a few numbers, so even the cap is
 * only a few tens of kilobytes — enough for very long feeds.
 */
export const DEFAULT_ASPECT_RATIO_CACHE_SIZE = 500;

/** Default number of load/size-probe retries (classic FastImage behavior). */
export const DEFAULT_RETRY_COUNT = 0;

/** Default delay between retries, in milliseconds. */
export const DEFAULT_RETRY_DELAY = 250;

/** Default fade-in duration (`0` = disabled, matching FastImage). */
export const DEFAULT_TRANSITION_DURATION = 0;

/** Aspect ratio used as a last-resort provisional value (a square). */
export const FALLBACK_ASPECT_RATIO = 1;
