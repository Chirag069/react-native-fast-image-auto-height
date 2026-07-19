# FAQ

### Is this a wrapper around FastImage?

It is an architecture layer over the FastImage engine. The native pipeline (Glide/SDWebImage, priorities, cache control, preloading) comes from `react-native-fast-image`; everything above it — automatic sizing, the aspect-ratio cache, request deduplication, retries, placeholders, transitions, lazy loading, and the typed public API — is this library. When you use no new props, the render output is exactly one native FastImage.

### Why depend on `react-native-fast-image` instead of forking the native code?

Glide/SDWebImage bindings are maintained in that package. This library focuses on auto-sizing, caching, and UX, and imports the engine from a single file (`InternalFastImage.tsx`).

### Does it work with the New Architecture?

This library's own code is pure TypeScript and renderer-agnostic. New Architecture support depends on the installed `react-native-fast-image` version and your React Native setup.

### How is the height calculated before the image loads?

In priority order: the in-memory ratio cache (synchronous), your `estimatedAspectRatio` (provisional), then a deduplicated `Image.getSize` probe. On iOS, FastImage `onLoad` dimensions can also settle the size. On Android, `onLoad` dimensions are ignored (unreliable). See [ARCHITECTURE.md](./ARCHITECTURE.md).

### Why is the size cache not persisted to disk?

It is **memory-only** (LRU, cleared on app restart). A URL's image can change server-side (merchant CDNs do this constantly), and a stale persisted ratio would silently break layouts.

### Does `autoHeight` work with `width: '100%'` or flex widths?

Yes — Yoga `aspectRatio` is applied once a ratio is known (`estimatedAspectRatio`, cache, or probe). No `onLayout` measurement is required for percentage/flex widths.

### Why does my auto-sized image not load until later?

The native image is intentionally deferred until a usable ratio exists. Pass `estimatedAspectRatio` (or call `FastImage.prefetchSize`) so the image can load immediately with a correct box — especially important on Android.

### Why do `autoHeight` images default to `resizeMode="contain"`?

Auto-sized boxes are meant to show the full image. `contain` letterboxes if the ratio is slightly wrong; `cover` would look zoomed/cropped. Classic mode (no auto-size) still defaults to `'cover'`. Pass `resizeMode="cover"` explicitly if you want cropping.

### Can I use both `autoHeight` and `autoWidth`?

No — one dimension must anchor the other. The library throws in development if you combine them.

### Do local images (`require(...)`) trigger network probes?

Never. Local assets resolve synchronously from the packager's asset registry.

### What happens if the size probe fails?

With `retryCount` set, it retries with `retryDelay` between attempts. If everything fails, the hook reports `status: 'failed'` and — if `estimatedAspectRatio` is set — the provisional layout simply remains. The failure is not cached, so a future mount retries.

### Is `onSizeResolved` called for cached images?

Yes, exactly once per source per mount — synchronously-cached resolutions report `fromCache: true`.

### What does `lazy` do?

It defers loading until the JS thread is idle (`requestIdleCallback`, with a macrotask fallback). It does not detect viewport visibility.

### GIF, WebP, AVIF, SVG?

Format support comes from the engine: GIF, WebP and AVIF work as in `react-native-fast-image` (SVG via their documented setup).

### Can I build my own component on this infrastructure?

Yes — `useImageDimensions`, `useAutoHeight` and `useAutoWidth` are public exports backed by the same cache and deduplication.

### Why do some fixed grid tiles look zoomed on Android but fine on iOS?

Fixed-size cards without `autoHeight` still use FastImage's default `cover`. Different source aspect ratios crop differently; platform decoders can also differ slightly. Use `resizeMode="contain"` (or match the cell ratio) for tiles that must show the full product. See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md).
