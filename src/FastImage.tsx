import { memo, useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import type {
  ImageStyle,
  LayoutChangeEvent,
  StyleProp,
  ViewStyle,
} from 'react-native';

import type { FastImageProps } from './types/props';
import type { Source, FastImageSource } from './types/source';
import type { ResolveSizeOptions, ResolvedImageSize } from './types/dimensions';
import type { OnLoadEvent } from './types/events';
import { cacheControl, priority, resizeMode, transition } from './constants';
import { useFastImageConfig } from './context/FastImageConfigContext';
import { useImageDimensions } from './hooks/useImageDimensions';
import { useAutoHeight } from './hooks/useAutoHeight';
import { useAutoWidth } from './hooks/useAutoWidth';
import { useImageLoader } from './hooks/useImageLoader';
import { createCacheKey } from './utils/createCacheKey';
import { invariant, warnOnce } from './utils/invariant';
import { FastImageService } from './services/FastImageService';
import { InternalFastImage } from './components/InternalFastImage';
import { Placeholder } from './components/Placeholder';
import { FadeView } from './components/FadeView';
import { extractImageDecorationStyle } from './helpers/splitStyles';

interface MeasuredSize {
  width?: number;
  height?: number;
}

function FastImageComponent(props: FastImageProps): ReactNode {
  const config = useFastImageConfig();
  const {
    source,
    style,
    children,
    onLoadStart,
    onProgress,
    onLoad,
    onError,
    onLoadEnd,
    onLayout,
    autoHeight = false,
    autoWidth = false,
    estimatedAspectRatio = config.estimatedAspectRatio,
    onSizeResolved,
    placeholder,
    transitionDuration = config.transitionDuration,
    retryCount = config.retryCount,
    retryDelay = config.retryDelay,
    lazy = false,
    // Everything below passes straight through to the native image.
    defaultSource,
    resizeMode: resizeModeProp,
    fallback,
    tintColor,
    blurRadius,
    transition: transitionProp,
    testID,
    ...accessibilityProps
  } = props;

  invariant(
    !(autoHeight && autoWidth),
    'autoHeight and autoWidth are mutually exclusive: one dimension must anchor the other. Provide a fixed width with autoHeight, or a fixed height with autoWidth.'
  );

  const flatStyle = useMemo<ImageStyle>(
    () => StyleSheet.flatten(style) ?? {},
    [style]
  );
  const styleWidth =
    typeof flatStyle.width === 'number' ? flatStyle.width : undefined;
  const styleHeight =
    typeof flatStyle.height === 'number' ? flatStyle.height : undefined;

  // User styles always win: auto-sizing only fills the missing dimension.
  const autoHeightEnabled = autoHeight && styleHeight === undefined;
  const autoWidthEnabled = autoWidth && styleWidth === undefined;
  warnOnce(
    !(autoHeight && styleHeight !== undefined),
    'autoHeight is ignored because style.height is set. Remove the explicit height to let FastImage size the image.'
  );
  warnOnce(
    !(autoWidth && styleWidth !== undefined),
    'autoWidth is ignored because style.width is set. Remove the explicit width to let FastImage size the image.'
  );

  const needsSizeResolution =
    autoHeightEnabled || autoWidthEnabled || onSizeResolved !== undefined;
  const { aspectRatio, reportDimensions } = useImageDimensions(source, {
    enabled: needsSizeResolution,
    retryCount,
    retryDelay,
    onSizeResolved,
  });

  // Percentage/flex dimensions are measured once via onLayout; the
  // estimatedAspectRatio masks the single measurement frame.
  const needsWidthMeasurement = autoHeightEnabled && styleWidth === undefined;
  const needsHeightMeasurement = autoWidthEnabled && styleHeight === undefined;
  const [measured, setMeasured] = useState<MeasuredSize>({});
  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      onLayout?.(event);
      if (!needsWidthMeasurement && !needsHeightMeasurement) {
        return;
      }
      const { width, height } = event.nativeEvent.layout;
      setMeasured((prev) => {
        const nextWidth = needsWidthMeasurement && width > 0 ? width : prev.width;
        const nextHeight =
          needsHeightMeasurement && height > 0 ? height : prev.height;
        if (nextWidth === prev.width && nextHeight === prev.height) {
          return prev;
        }
        return { width: nextWidth, height: nextHeight };
      });
    },
    [onLayout, needsWidthMeasurement, needsHeightMeasurement]
  );

  const computedHeight = useAutoHeight({
    enabled: autoHeightEnabled,
    width: styleWidth ?? measured.width,
    aspectRatio,
    estimatedAspectRatio,
  });
  const computedWidth = useAutoWidth({
    enabled: autoWidthEnabled,
    height: styleHeight ?? measured.height,
    aspectRatio,
    estimatedAspectRatio,
  });

  const composedStyle = useMemo<StyleProp<ImageStyle>>(() => {
    if (computedHeight === undefined && computedWidth === undefined) {
      return style;
    }
    const autoSize: ImageStyle = {};
    if (computedHeight !== undefined) {
      autoSize.height = computedHeight;
    }
    if (computedWidth !== undefined) {
      autoSize.width = computedWidth;
    }
    return [style, autoSize];
  }, [style, computedHeight, computedWidth]);

  // Harvest intrinsic dimensions from the load we already paid for.
  const handleLoad = useCallback(
    (event: OnLoadEvent) => {
      const { width, height } = event.nativeEvent;
      reportDimensions({ width, height });
      onLoad?.(event);
    },
    [reportDimensions, onLoad]
  );

  const sourceKey = source !== undefined ? createCacheKey(source) : null;
  const { shouldLoad, attempt, loaded, handlers } = useImageLoader({
    sourceKey,
    retryCount,
    retryDelay,
    lazy,
    onLoadStart,
    onLoad: handleLoad,
    onError,
    onLoadEnd,
  });

  const hasPlaceholder = placeholder !== undefined && placeholder !== null;
  const needsContainer = hasPlaceholder || transitionDuration > 0;

  const imageProps = {
    ...accessibilityProps,
    source: shouldLoad ? source : undefined,
    defaultSource,
    resizeMode: resizeModeProp,
    fallback,
    tintColor,
    blurRadius,
    transition: transitionProp,
    testID,
    onLoadStart: handlers.onLoadStart,
    onProgress,
    onLoad: handlers.onLoad,
    onError: handlers.onError,
    onLoadEnd: handlers.onLoadEnd,
  } as const;

  if (!needsContainer) {
    // Fast path: exactly one native image, byte-for-byte FastImage behavior.
    return (
      <InternalFastImage
        {...imageProps}
        key={attempt}
        style={composedStyle}
        onLayout={handleLayout}
      >
        {children}
      </InternalFastImage>
    );
  }

  const decorationStyle = extractImageDecorationStyle(flatStyle);
  const showPlaceholder = hasPlaceholder && !loaded;

  return (
    <View
      style={composedStyle as StyleProp<ViewStyle>}
      onLayout={handleLayout}
    >
      {showPlaceholder ? (
        <Placeholder
          placeholder={placeholder}
          resizeMode={resizeModeProp}
          style={[StyleSheet.absoluteFill, decorationStyle]}
          testID={testID !== undefined ? `${testID}-placeholder` : undefined}
        />
      ) : null}
      <FadeView
        visible={loaded}
        duration={transitionDuration}
        style={StyleSheet.absoluteFill}
      >
        <InternalFastImage
          {...imageProps}
          key={attempt}
          style={[StyleSheet.absoluteFill, decorationStyle]}
        />
      </FadeView>
      {children}
    </View>
  );
}

const MemoizedFastImage = memo(FastImageComponent);
MemoizedFastImage.displayName = 'FastImage';

interface FastImageStatics {
  /** FastImage-compatible enum: `contain | cover | stretch | center`. */
  resizeMode: typeof resizeMode;
  /** FastImage-compatible enum: `low | normal | high`. */
  priority: typeof priority;
  /** FastImage-compatible enum: `immutable | web | cacheOnly`. */
  cacheControl: typeof cacheControl;
  /** `@d11` FastImage-compatible enum: `fade | none`. */
  transition: typeof transition;
  /** Preloads images into the native (Glide / SDWebImage) cache. */
  preload: (sources: Source[]) => void;
  /** Clears the native in-memory image cache. */
  clearMemoryCache: () => Promise<void>;
  /** Clears the native on-disk image cache. */
  clearDiskCache: () => Promise<void>;
  /**
   * Warms the aspect-ratio cache for a source before it renders, so list
   * items mount with their final height. Resolve sizes while data loads.
   */
  prefetchSize: (
    source: FastImageSource,
    options?: ResolveSizeOptions
  ) => Promise<ResolvedImageSize>;
  /** Clears the aspect-ratio (size) cache. Does not touch native caches. */
  clearSizeCache: () => void;
}

export type FastImageComponentType = typeof MemoizedFastImage &
  FastImageStatics;

/**
 * The definitive FastImage successor: 100% API-compatible with
 * `react-native-fast-image` / `@d11/react-native-fast-image`, plus
 * automatic sizing (`autoHeight`, `autoWidth`), placeholders, transitions,
 * retries and lazy loading.
 *
 * Migration is one line: change the import.
 */
export const FastImage: FastImageComponentType = Object.assign(
  MemoizedFastImage,
  {
    resizeMode,
    priority,
    cacheControl,
    transition,
    preload: FastImageService.preload,
    clearMemoryCache: FastImageService.clearMemoryCache,
    clearDiskCache: FastImageService.clearDiskCache,
    prefetchSize: FastImageService.prefetchSize,
    clearSizeCache: FastImageService.clearSizeCache,
  } satisfies FastImageStatics
);
