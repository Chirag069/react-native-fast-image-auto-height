/**
 * Source-related types.
 *
 * These are 100% wire-compatible with `react-native-fast-image`.
 * Names and shapes are frozen for backward compatibility and must never
 * be renamed.
 */

/**
 * How the image should be resized to fit its container.
 * Mirrors `FastImage.resizeMode.*`.
 */
export type ResizeMode = 'contain' | 'cover' | 'stretch' | 'center';

/**
 * Native download priority for the image request.
 * Mirrors `FastImage.priority.*`.
 */
export type Priority = 'low' | 'normal' | 'high';

/**
 * Native cache behavior for the image request.
 * Mirrors `FastImage.cacheControl.*`.
 */
export type CacheControlMode = 'immutable' | 'web' | 'cacheOnly';

/**
 * Native display transition (passed through when the engine supports it).
 * Mirrors `FastImage.transition.*`.
 */
export type NativeTransition = 'fade' | 'none';

/**
 * A remote image source, identical to FastImage's `source` prop shape.
 */
export interface Source {
  /** Remote URI of the image. */
  uri?: string;
  /** HTTP headers sent with the image request (e.g. `Authorization`). */
  headers?: Record<string, string>;
  /** Native download priority. Defaults to `'normal'`. */
  priority?: Priority;
  /** Native cache behavior. Defaults to `'immutable'`. */
  cache?: CacheControlMode;
}

/**
 * Any image source accepted by FastImage: a remote {@link Source} or a
 * local asset reference returned by `require('./image.png')`.
 */
export type FastImageSource = Source | number;
