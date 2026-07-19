import { memo, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
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

function isUsableRatio(ratio: number | null | undefined): ratio is number {
  return ratio !== null && ratio !== undefined && Number.isFinite(ratio) && ratio > 0;
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

  const activeRatio = isUsableRatio(aspectRatio)
    ? aspectRatio
    : isUsableRatio(estimatedAspectRatio)
      ? estimatedAspectRatio
      : undefined;

  // Auto-sized images must have a known box before the native engine loads.
  // On Android, Glide center-crops to the *current* view bounds; loading into
  // a height-less (or wrong-height) view permanently looks zoomed even after
  // the correct height is applied later.
  const sizingReady =
    (!autoHeightEnabled && !autoWidthEnabled) || activeRatio !== undefined;

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      onLayout?.(event);
    },
    [onLayout]
  );

  const computedHeight = useAutoHeight({
    enabled: autoHeightEnabled && styleWidth !== undefined,
    width: styleWidth,
    aspectRatio,
    estimatedAspectRatio,
  });
  const computedWidth = useAutoWidth({
    enabled: autoWidthEnabled && styleHeight !== undefined,
    height: styleHeight,
    aspectRatio,
    estimatedAspectRatio,
  });

  const composedStyle = useMemo<StyleProp<ImageStyle>>(() => {
    if (!autoHeightEnabled && !autoWidthEnabled) {
      return style;
    }
    if (activeRatio === undefined) {
      return style;
    }

    const autoSize: ImageStyle = {};
    if (autoHeightEnabled) {
      // Numeric width → explicit height (definite bounds for Glide/SDWebImage).
      // Percentage/flex width → Yoga aspectRatio (no onLayout required).
      if (computedHeight !== undefined) {
        autoSize.height = computedHeight;
      } else {
        autoSize.aspectRatio = activeRatio;
      }
    }
    if (autoWidthEnabled) {
      if (computedWidth !== undefined) {
        autoSize.width = computedWidth;
      } else {
        autoSize.aspectRatio = activeRatio;
      }
    }
    return [style, autoSize];
  }, [
    style,
    autoHeightEnabled,
    autoWidthEnabled,
    activeRatio,
    computedHeight,
    computedWidth,
  ]);

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

  // Auto-sized boxes are meant to show the full image. Default to contain so
  // a slightly-wrong ratio letterboxes instead of cover-zooming (especially
  // visible on Android). Callers can still pass cover explicitly.
  const effectiveResizeMode =
    resizeModeProp ??
    (autoHeightEnabled || autoWidthEnabled ? 'contain' : undefined);

  // Remount when the settled ratio changes so Android Glide does not keep a
  // bitmap center-cropped to the previous (wrong / zero) bounds.
  const nativeKey =
    Platform.OS === 'android' && (autoHeightEnabled || autoWidthEnabled)
      ? `${attempt}-${activeRatio ?? 'pending'}`
      : String(attempt);

  const imageProps = {
    ...accessibilityProps,
    source: shouldLoad && sizingReady ? source : undefined,
    defaultSource,
    resizeMode: effectiveResizeMode,
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
        key={nativeKey}
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
          resizeMode={effectiveResizeMode}
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
          key={nativeKey}
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
  /** FastImage-compatible enum: `fade | none` (passed through when supported). */
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
 * `react-native-fast-image`, plus automatic sizing (`autoHeight`,
 * `autoWidth`), placeholders, transitions, retries and lazy loading.
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
