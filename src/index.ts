/**
 * react-native-fast-image-auto-height
 *
 * The definitive FastImage successor: FastImage performance and API
 * compatibility, plus automatic height/width calculation, aspect-ratio
 * caching, promise deduplication, retries, placeholders and transitions.
 *
 * Migration from `react-native-fast-image` / `@d11/react-native-fast-image`
 * requires changing only the import.
 */
import { FastImage } from './FastImage';

export default FastImage;
export { FastImage };
export type { FastImageComponentType } from './FastImage';

// Hooks — build custom image components on the same infrastructure.
export { useImageDimensions } from './hooks/useImageDimensions';
export type {
  UseImageDimensionsOptions,
  UseImageDimensionsResult,
} from './hooks/useImageDimensions';
export { useAutoHeight } from './hooks/useAutoHeight';
export type { UseAutoHeightParams } from './hooks/useAutoHeight';
export { useAutoWidth } from './hooks/useAutoWidth';
export type { UseAutoWidthParams } from './hooks/useAutoWidth';

// Global configuration.
export { FastImageConfigProvider } from './context/FastImageConfigContext';
export type { FastImageConfigProviderProps } from './context/FastImageConfigContext';

// Public types.
export type {
  FastImageProps,
  FastImageConfig,
  Source,
  FastImageSource,
  ResizeMode,
  Priority,
  CacheControlMode,
  NativeTransition,
  OnLoadEvent,
  OnProgressEvent,
  ImageDimensions,
  ResolvedImageSize,
  SizeResolutionStatus,
  ResolveSizeOptions,
  SizeCacheStorage,
} from './types';
