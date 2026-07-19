# Architecture

## Layered design

```
UI Layer          FastImage.tsx, Placeholder, FadeView, InternalFastImage
   ↓
Hooks             useImageDimensions, useAutoHeight, useAutoWidth, useImageLoader
   ↓
Services          ImageSizeService, FastImageService
   ↓
Managers          CacheManager, RequestManager
   ↓
Cache             AspectRatioCache (LRU), PendingRequestCache, MemoryCache
   ↓
Native            react-native-fast-image (Glide / SDWebImage)
```

Layer rules are **enforced by ESLint**, not convention (see `eslint.config.mjs`):

- Components never call `Image.getSize` — only `utils/getImageSize.ts` may, and only `ImageSizeService` consumes it.
- Lower layers never import from higher layers.
- Exactly one file imports the native engine: `src/components/InternalFastImage.tsx`.
- Everything below the UI layer is pure TypeScript with no JSX — trivially unit-testable.

## How size resolution works

Dimension data has these sources, consulted in priority order:

1. **AspectRatioCache hit** — synchronous, zero cost, no layout jump. Bounded LRU (500 entries by default; a key string and three numbers per entry).
2. **`estimatedAspectRatio`** — provisional layout so the box exists before the probe finishes (and so the native image is allowed to load).
3. **`ImageSizeService.resolve()`** — an explicit `Image.getSize` / `Image.getSizeWithHeaders` probe, deduplicated and retried. **Source of truth on Android.**
4. **FastImage `onLoad` dimensions** (**iOS only**) — harvested via `ImageSizeService.reportLoadedDimensions`. On Android this path is a no-op because FastImage often reports view/layout size instead of intrinsic size (see DylanVann/react-native-fast-image#461 / #944).

Default flow for an uncached remote image with `autoHeight`:

```
render 1: estimatedAspectRatio (or wait) — probe starts; native image loads only once a ratio exists
render 2: probe (or iOS onLoad) settles the real ratio — height or Yoga aspectRatio updates
render 3+: synchronous cache hit, forever (per session)
```

Local assets (`require(...)`) resolve synchronously via `resolveAssetSource` — never a probe.

### Auto-size layout strategy

| Anchor | How the missing dimension is applied |
| --- | --- |
| Numeric `style.width` + `autoHeight` | Explicit pixel `height` via `calculateHeight` |
| Percentage/flex width + `autoHeight` | Yoga `aspectRatio` style (no `onLayout` measurement required) |
| Numeric `style.height` + `autoWidth` | Explicit pixel `width` via `calculateWidth` |
| Percentage/flex height + `autoWidth` | Yoga `aspectRatio` style |

With auto-sizing, `resizeMode` defaults to `contain`. On Android, the native image remounts when the settled ratio changes so Glide does not keep a bitmap center-cropped to previous (wrong / zero) bounds.

### Why `Image.getSize` at all, if `onLoad` is free?

`onLoad` only fires once the image actually renders — and on Android its dimensions are unreliable. `FastImage.prefetchSize()` and `useImageDimensions` need sizes *before* any image mounts (feeds, masonry layouts). The probe fills that gap; iOS `onLoad` harvesting still populates the cache for free when available.

### The double-fetch caveat

`Image.getSize` goes through React Native's image pipeline (Fresco / RCTImageLoader), not Glide/SDWebImage — so a probe may hit the network even when FastImage has the bytes cached. Mitigations: cache-first resolution, iOS `onLoad` harvesting, and `estimatedAspectRatio` / `prefetchSize` so probes are rare in hot paths.

## Promise deduplication

`PendingRequestCache` stores in-flight promises by cache key. If 100 components request the same URL concurrently, the probe factory runs once and all 100 await the same promise. Settled promises are evicted so failures stay retryable.

Cache keys come from `createCacheKey`: the URI, plus an order-independent hash of the headers when present (the same URI behind different `Authorization` headers may serve different images and must not collide). `priority` and `cache` options do not affect identity.

## Cancellation semantics

`Image.getSize` is not abortable. Instead of cancelling, unmounted or source-changed subscribers **detach** (stale-guard tokens in `useImageDimensions`): no state is ever written after unmount, no stale result is ever applied to a recycled cell — but the shared probe completes and still populates the cache. Work already paid for is never thrown away.

## Size cache storage

**In-memory LRU only** (`AspectRatioCache`, default 500 entries). Cleared when the JS runtime restarts. Nothing is written to disk.

Why not disk: a merchant CDN can replace an image behind an unchanged URL. A stale persisted ratio would silently break layouts.

## Features

| Feature | How |
| --- | --- |
| In-memory aspect-ratio LRU | `AspectRatioCache` via `ImageSizeService` / `FastImage.prefetchSize` / `clearSizeCache` |
| `placeholder` (skeleton, shimmer, node, or image source) | `placeholder` prop — any React node or `Source` / `require(...)` |
| Idle-deferred loading | `lazy` prop (`requestIdleCallback` / macrotask fallback) |
| Fade transition | `transitionDuration` |
| Load retries | `retryCount` / `retryDelay` |
| Auto height / width | `autoHeight` / `autoWidth` + `estimatedAspectRatio` |
| Hooks | `useImageDimensions`, `useAutoHeight`, `useAutoWidth` |
| App-wide defaults | `FastImageConfigProvider` |
