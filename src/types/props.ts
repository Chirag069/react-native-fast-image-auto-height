import type { ReactNode } from 'react';
import type {
  AccessibilityProps,
  ColorValue,
  LayoutChangeEvent,
  StyleProp,
  ImageStyle,
} from 'react-native';
import type { FastImageSource, NativeTransition, ResizeMode } from './source';
import type { ResolvedImageSize } from './dimensions';
import type { OnLoadEvent, OnProgressEvent } from './events';

/**
 * Props for the public `<FastImage />` component.
 *
 * The first block is byte-for-byte compatible with
 * `react-native-fast-image` — migrating requires changing only the
 * import. The second block is additive and fully optional: omitting every
 * new prop yields exactly the classic FastImage behavior.
 */
export interface FastImageProps extends AccessibilityProps {
  // ── FastImage-compatible props (frozen, never renamed) ────────────────

  /** Remote source (`{ uri, headers, priority, cache }`) or local `require(...)` asset. */
  source?: FastImageSource;
  /** Local asset shown while the remote image loads. */
  defaultSource?: number;
  /** How the image is resized to fit its container. Defaults to `'cover'`. */
  resizeMode?: ResizeMode;
  /** If `true`, falls back to the plain React Native `Image` implementation. */
  fallback?: boolean;
  /** Tint applied to all non-transparent pixels. */
  tintColor?: ColorValue;
  /** Blur radius applied to the image. */
  blurRadius?: number;
  /**
   * Native transition applied when the image is displayed (passed through
   * when the engine supports it). Prefer {@link transitionDuration} for a
   * configurable JS-driven fade.
   */
  transition?: NativeTransition;
  /** Style for the image. Supports `borderRadius`. */
  style?: StyleProp<ImageStyle>;
  /** Test identifier for the underlying image. */
  testID?: string;
  /** Content rendered on top of the image. */
  children?: ReactNode;
  /** Called when the image starts loading. */
  onLoadStart?: () => void;
  /** Called while the image downloads. */
  onProgress?: (event: OnProgressEvent) => void;
  /** Called when the image loads successfully, with its intrinsic dimensions. */
  onLoad?: (event: OnLoadEvent) => void;
  /** Called when the image fails to load (after all retries are exhausted). */
  onError?: () => void;
  /** Called when loading either succeeds or fails. */
  onLoadEnd?: () => void;
  /** Standard layout callback. */
  onLayout?: (event: LayoutChangeEvent) => void;

  // ── New capabilities (all optional; no behavior change when omitted) ──

  /**
   * Automatically compute the image height from its rendered width and its
   * intrinsic aspect ratio. Requires a width (numeric `style.width`, or a
   * flex/percentage width measured via layout). Mutually exclusive with
   * {@link autoWidth}.
   */
  autoHeight?: boolean;
  /**
   * Automatically compute the image width from its rendered height and its
   * intrinsic aspect ratio. Mutually exclusive with {@link autoHeight}.
   */
  autoWidth?: boolean;
  /**
   * Aspect ratio (`width / height`) used for layout before the intrinsic
   * size is known. Prevents layout jumps in lists. Example: `4 / 3`.
   */
  estimatedAspectRatio?: number;
  /**
   * Called exactly once per mount when the intrinsic size is known —
   * either synchronously from cache or after async resolution.
   */
  onSizeResolved?: (result: ResolvedImageSize) => void;
  /**
   * Rendered while the image is loading. Accepts any React node (skeleton,
   * shimmer, ...), a remote {@link FastImageSource}, or a local asset.
   */
  placeholder?: ReactNode | FastImageSource;
  /**
   * Fade-in duration in milliseconds applied when the image finishes
   * loading. `0` (default) disables the transition, matching FastImage.
   */
  transitionDuration?: number;
  /**
   * Number of times a failed image load is retried. Defaults to `0`
   * (classic FastImage behavior). `onError` fires only after the final
   * attempt fails.
   */
  retryCount?: number;
  /** Delay in milliseconds between load retries. Defaults to `250`. */
  retryDelay?: number;
  /**
   * Defers the image load until the JS thread is idle
   * (`requestIdleCallback`). Viewport-based visibility detection will
   * extend this prop in a future minor version.
   */
  lazy?: boolean;
}
