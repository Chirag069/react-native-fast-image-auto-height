# FAQ

### Is this a wrapper around FastImage?

It is an architecture layer over the maintained FastImage engine. The native pipeline (Glide/SDWebImage, priorities, cache control, preloading) comes from `@d11/react-native-fast-image`; everything above it — automatic sizing, the aspect-ratio cache, request deduplication, retries, placeholders, transitions, lazy loading, and the typed public API — is this library. When you use no new props, the render output is exactly one native FastImage.

### Why depend on `@d11/react-native-fast-image` instead of forking the native code?

Maintaining forked Glide/SDWebImage bindings is what killed the original FastImage. Delegating to the actively maintained fork means every native fix (new RN versions, Fabric changes, AVIF) lands here with zero effort, forever. The dependency is isolated behind a single file, so the engine can be swapped in a one-file change if the ecosystem moves.

### Does it work with the New Architecture?

Yes. The engine supports Fabric (>= 8.7.0) and TurboModules (>= 8.8.0); this library's own code is pure TypeScript and renderer-agnostic.

### How is the height calculated before the image loads?

In priority order: the in-memory ratio cache (synchronous), your `estimatedAspectRatio` (provisional), then the first of the image's `onLoad` dimensions or a deduplicated `Image.getSize` probe. See [ARCHITECTURE.md](./ARCHITECTURE.md).

### Why is the size cache not persisted to disk?

Because a URL's image can change server-side (merchant CDNs do this constantly), and a stale persisted ratio would silently break layouts. Persistence will ship as an opt-in plugin (`SizeCacheStorage`) for apps with immutable URLs.

### Does `autoHeight` work with `width: '100%'` or flex widths?

Yes — the width is measured once via `onLayout` (a single frame, masked by `estimatedAspectRatio` or a `placeholder`), then the height is derived from it.

### Can I use both `autoHeight` and `autoWidth`?

No — one dimension must anchor the other. The library throws in development if you combine them.

### Do local images (`require(...)`) trigger network probes?

Never. Local assets resolve synchronously from the packager's asset registry.

### What happens if the size probe fails?

With `retryCount` set, it retries with `retryDelay` between attempts. If everything fails, the hook reports `status: 'failed'` and — if `estimatedAspectRatio` is set — the provisional layout simply remains. The failure is not cached, so a future mount retries.

### Is `onSizeResolved` called for cached images?

Yes, exactly once per source per mount — synchronously-cached resolutions report `fromCache: true`.

### Does `lazy` detect viewport visibility?

Not yet. In v1 `lazy` defers loading until the JS thread is idle. Viewport-based visibility detection is planned and will extend the same prop without breaking it.

### GIF, WebP, AVIF, SVG?

Format support comes from the engine: GIF, WebP and AVIF work as in `@d11/react-native-fast-image` (SVG via their documented setup).

### Can I build my own component on this infrastructure?

Yes — `useImageDimensions`, `useAutoHeight` and `useAutoWidth` are public exports backed by the same cache and deduplication.
