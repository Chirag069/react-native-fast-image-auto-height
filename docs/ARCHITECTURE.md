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
- Exactly one file imports the native engine: `src/components/InternalFastImage.tsx`. If the ecosystem moves to a different FastImage fork or backend, that one file changes and nothing else.
- Everything below the UI layer is pure TypeScript with no JSX — trivially unit-testable.

## How size resolution works

Dimension data has three sources, consulted in priority order:

1. **AspectRatioCache hit** — synchronous, zero cost, no layout jump. Bounded LRU (500 entries by default; a key string and three numbers per entry).
2. **FastImage's own `onLoad` event** — `nativeEvent.width/height` arrives free with the actual image load through the native cache. Always harvested into the ratio cache via `ImageSizeService.reportLoadedDimensions`.
3. **`ImageSizeService.resolve()`** — an explicit `Image.getSize` / `Image.getSizeWithHeaders` probe, deduplicated and retried.

Default flow for an uncached remote image with `autoHeight`:

```
render 1: estimatedAspectRatio (or no height) — probe and image load start in parallel
render 2: whichever answers first (onLoad or probe) settles the real height
render 3+: synchronous cache hit, forever (per session)
```

Local assets (`require(...)`) resolve synchronously via `resolveAssetSource` — never a probe.

### Why `Image.getSize` at all, if `onLoad` is free?

`onLoad` only fires once the image actually renders. `FastImage.prefetchSize()` and `useImageDimensions` need sizes *before* any image mounts (feeds, masonry layouts). The probe fills that gap; the two paths share one cache and deduplicate against each other.

### The double-fetch caveat

`Image.getSize` goes through React Native's image pipeline (Fresco / RCTImageLoader), not Glide/SDWebImage — so a probe may hit the network even when FastImage has the bytes cached. Mitigations, in order: cache-first resolution, `onLoad` harvesting (images that render never need a probe again), and a future native TurboModule that reads dimensions from the Glide/SDWebImage cache directly — `ImageSizeService` reserves that slot without any public API change.

## Promise deduplication

`PendingRequestCache` stores in-flight promises by cache key. If 100 components request the same URL concurrently, the probe factory runs once and all 100 await the same promise. Settled promises are evicted so failures stay retryable.

Cache keys come from `createCacheKey`: the URI, plus an order-independent hash of the headers when present (the same URI behind different `Authorization` headers may serve different images and must not collide). `priority` and `cache` options do not affect identity.

## Cancellation semantics

`Image.getSize` is not abortable. Instead of cancelling, unmounted or source-changed subscribers **detach** (stale-guard tokens in `useImageDimensions`): no state is ever written after unmount, no stale result is ever applied to a recycled cell — but the shared probe completes and still populates the cache. Work already paid for is never thrown away.

## Why the cache is memory-only in v1

A merchant CDN can replace an image behind an unchanged URL. A persisted aspect ratio would then produce wrong layouts forever, invisibly. Memory-only is correct-by-default; persistence is an explicit opt-in for apps whose URLs are immutable.

The seam already exists: `SizeCacheStorage` (get/set/clear) with write-through wiring in `CacheManager.setStorage()`. MMKV and AsyncStorage plugins can ship as separate packages without touching the core.

## Extension points for planned features

| Future feature | Slot |
| --- | --- |
| MMKV / AsyncStorage persistence | `SizeCacheStorage` plugin via `CacheManager.setStorage` |
| BlurHash / ThumbHash | `placeholder` prop already accepts arbitrary nodes and sources |
| Visibility detection | `lazy` prop contract ("may delay loading") extends without breakage |
| Native dimension reads from Glide/SDWebImage | Internal swap inside `ImageSizeService.resolve` |
| Progressive loading / shimmer / skeleton | New optional props; the container layer already exists |
