/**
 * Global defaults configurable via `<FastImageConfigProvider />`.
 * Per-component props always win over these defaults.
 */
export interface FastImageConfig {
  /** Default {@link FastImageProps.retryCount} for every FastImage. */
  retryCount?: number;
  /** Default {@link FastImageProps.retryDelay} for every FastImage. */
  retryDelay?: number;
  /** Default {@link FastImageProps.transitionDuration} for every FastImage. */
  transitionDuration?: number;
  /** Default {@link FastImageProps.estimatedAspectRatio} for every FastImage. */
  estimatedAspectRatio?: number;
}
