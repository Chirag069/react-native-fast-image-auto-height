# API reference

## `<FastImage />`

The default export. Renders exactly one native FastImage when no new prop is used; adds a light container only when `placeholder` or `transitionDuration` require it.

Native engine: peer dependency [`react-native-fast-image`](https://github.com/DylanVann/react-native-fast-image) (>= 8.6.0).

### FastImage-compatible props (frozen, never renamed)

| Prop | Type | Description |
| --- | --- | --- |
| `source` | `Source \| number` | Remote source or `require(...)` asset |
| `source.uri` | `string` | Image URL |
| `source.headers` | `Record<string, string>` | Request headers (e.g. `Authorization`) |
| `source.priority` | `'low' \| 'normal' \| 'high'` | Native download priority (`FastImage.priority.*`) |
| `source.cache` | `'immutable' \| 'web' \| 'cacheOnly'` | Native cache mode (`FastImage.cacheControl.*`) |
| `defaultSource` | `number` | Local asset shown while loading |
| `resizeMode` | `'contain' \| 'cover' \| 'stretch' \| 'center'` | Classic mode default `'cover'`. With `autoHeight` / `autoWidth`, defaults to `'contain'` unless set explicitly. |
| `fallback` | `boolean` | Fall back to the plain RN `Image` implementation |
| `tintColor` | `ColorValue` | Tints all non-transparent pixels |
| `blurRadius` | `number` | Blur filter radius |
| `transition` | `'fade' \| 'none'` | Native display transition (`FastImage.transition.*`), passed through when the engine supports it |
| `style` | `StyleProp<ImageStyle>` | Supports `borderRadius` |
| `testID` | `string` | Test identifier |
| `children` | `ReactNode` | Rendered over the image |
| `onLoadStart` | `() => void` | Load started |
| `onProgress` | `(e: OnProgressEvent) => void` | Download progress |
| `onLoad` | `(e: OnLoadEvent) => void` | Loaded, with `nativeEvent.width` / `height` (intrinsic on iOS; often view-sized on Android — not used for auto-sizing there) |
| `onError` | `() => void` | Load failed (after all retries) |
| `onLoadEnd` | `() => void` | Load finished (success or failure) |
| `onLayout` | `(e: LayoutChangeEvent) => void` | Standard layout callback |

### New props (all optional; omitting them = classic FastImage)

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `autoHeight` | `boolean` | `false` | Compute height from the rendered width and the intrinsic aspect ratio. Requires a width: numeric `style.width`, or percentage/flex width (Yoga `aspectRatio`). Mutually exclusive with `autoWidth`. |
| `autoWidth` | `boolean` | `false` | Compute width from the rendered height and the intrinsic aspect ratio. |
| `estimatedAspectRatio` | `number` | — | Provisional `width / height` used for layout before the intrinsic size is known. Recommended for every auto-sized image — also allows the native image to load before the probe finishes. |
| `onSizeResolved` | `(size: ResolvedImageSize) => void` | — | Fired exactly once per source when the intrinsic size is known. `fromCache` tells you whether it was synchronous. |
| `placeholder` | `ReactNode \| Source \| number` | — | Rendered while loading: any node (skeleton/shimmer) or an image source (blurred thumb, local asset). |
| `transitionDuration` | `number` | `0` | JS-driven fade-in on load, in ms. `0` disables it (classic behavior). Runs on the native animation driver. |
| `retryCount` | `number` | `0` | Failed loads are retried this many times. `onError`/`onLoadEnd` fire only after the final attempt. |
| `retryDelay` | `number` | `250` | Delay between retries, ms. |
| `lazy` | `boolean` | `false` | Defers the load until the JS thread is idle (`requestIdleCallback`). |

#### Auto-size semantics (the contract)

1. `autoHeight` + `autoWidth` together throws in development — one dimension must anchor the other.
2. An explicit `style.height` next to `autoHeight` **wins**; the library warns in development and does nothing.
3. Resolution priority: **cache hit** (synchronous) → **`estimatedAspectRatio`** (provisional) → **`Image.getSize` probe** → on **iOS only**, FastImage **`onLoad` dimensions**. Results are cached in the LRU for the session.
4. Local assets (`require(...)`) resolve synchronously — never a probe, never a layout jump.
5. Numeric width → explicit pixel `height`. Percentage/flex width → Yoga `aspectRatio` style.
6. The native image does **not** load until a usable ratio is known (estimate, cache, or probe). This prevents Android Glide from center-cropping into a height-less view.
7. With auto-sizing, `resizeMode` defaults to `'contain'`. Pass `'cover'` explicitly if you want cropping.

## Statics

### FastImage-compatible

```ts
FastImage.resizeMode   // { contain, cover, stretch, center }
FastImage.priority     // { low, normal, high }
FastImage.cacheControl // { immutable, web, cacheOnly }
FastImage.transition   // { fade, none }

FastImage.preload(sources: Source[]): void
FastImage.clearMemoryCache(): Promise<void>
FastImage.clearDiskCache(): Promise<void>
```

### New

```ts
// Warm the aspect-ratio cache before rendering (ideal for feeds).
FastImage.prefetchSize(
  source: Source | number,
  options?: { retryCount?: number; retryDelay?: number }
): Promise<ResolvedImageSize>

// Clear the aspect-ratio cache (does not touch native image caches).
FastImage.clearSizeCache(): void
```

## Hooks

### `useImageDimensions(source, options?)`

```ts
const { dimensions, aspectRatio, status, fromCache, reportDimensions } =
  useImageDimensions(source, {
    enabled?: boolean,          // default true
    retryCount?: number,
    retryDelay?: number,
    onSizeResolved?: (size: ResolvedImageSize) => void,
  });
// status: 'idle' | 'resolving' | 'resolved' | 'failed'
```

Cache-first, deduplicated, retried, stale-guarded (safe for recycled list cells) and unmount-safe.

`reportDimensions` feeds sizes from elsewhere (e.g. FastImage `onLoad`). On Android, `ImageSizeService` ignores those reports because they are often view/layout size, not intrinsic size.

### `useAutoHeight({ enabled, width, aspectRatio, estimatedAspectRatio? })`

Returns a pixel-grid-rounded height, or `undefined` when it cannot be derived.

### `useAutoWidth({ enabled, height, aspectRatio, estimatedAspectRatio? })`

The mirror image.

## `<FastImageConfigProvider config={...}>`

App-wide defaults, overridable per component:

```ts
interface FastImageConfig {
  retryCount?: number;
  retryDelay?: number;
  transitionDuration?: number;
  estimatedAspectRatio?: number;
}
```

## Exported types

`FastImageProps`, `FastImageConfig`, `Source`, `FastImageSource`, `ResizeMode`, `Priority`, `CacheControlMode`, `NativeTransition`, `OnLoadEvent`, `OnProgressEvent`, `ImageDimensions`, `ResolvedImageSize`, `SizeResolutionStatus`, `ResolveSizeOptions`, `SizeCacheStorage`.

```ts
interface ResolvedImageSize {
  width: number;       // intrinsic pixels
  height: number;      // intrinsic pixels
  aspectRatio: number; // width / height
  fromCache: boolean;  // served synchronously from the ratio cache
}
```
