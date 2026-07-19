/**
 * The ONLY file in the library allowed to import the native engine
 * (enforced by lint). If the ecosystem moves to a different FastImage fork
 * or backend, this seam is the single place that changes.
 */
import NativeFastImage from 'react-native-fast-image';
import type { ComponentType, ReactNode } from 'react';
import type {
  AccessibilityProps,
  ColorValue,
  ImageStyle,
  LayoutChangeEvent,
  StyleProp,
} from 'react-native';
import type {
  FastImageSource,
  NativeTransition,
  ResizeMode,
} from '../types/source';
import type { OnLoadEvent, OnProgressEvent } from '../types/events';

/**
 * The native surface this library consumes, expressed in standard React
 * Native types. Matches `react-native-fast-image`'s runtime contract.
 */
export interface InternalFastImageProps extends AccessibilityProps {
  source?: FastImageSource;
  defaultSource?: number;
  resizeMode?: ResizeMode;
  fallback?: boolean;
  transition?: NativeTransition;
  tintColor?: ColorValue;
  blurRadius?: number;
  style?: StyleProp<ImageStyle>;
  testID?: string;
  children?: ReactNode;
  onLoadStart?: () => void;
  onProgress?: (event: OnProgressEvent) => void;
  onLoad?: (event: OnLoadEvent) => void;
  onError?: () => void;
  onLoadEnd?: () => void;
  onLayout?: (event: LayoutChangeEvent) => void;
}

/**
 * Render-compatible pass-through to the native FastImage component.
 *
 * The cast below is the deliberate, single type bridge of the library:
 * `react-native-fast-image` declares its own `ImageStyle` with border radii
 * narrowed to `number`, which rejects perfectly valid React Native styles
 * (animated values). The runtime component accepts standard RN styles
 * unchanged, so we re-type the seam with the standard types once, here, and
 * nowhere else.
 */
export const InternalFastImage =
  NativeFastImage as unknown as ComponentType<InternalFastImageProps>;

/** Native static surface re-exported for the services layer. */
export const nativeFastImageStatics = {
  preload: NativeFastImage.preload,
  clearMemoryCache: NativeFastImage.clearMemoryCache,
  clearDiskCache: NativeFastImage.clearDiskCache,
} as const;
