# Performance guide

## What the library does for you automatically

- **`React.memo`** on the public component — parent re-renders with unchanged props are free.
- **Source identity by cache key, not object identity** — inline `source={{ uri }}` literals never re-trigger resolution.
- **One size probe per URL** — concurrent requests share a single in-flight promise.
- **Session-long ratio cache** — a URL is measured once; every later mount is synchronous.
- **iOS `onLoad` harvesting** — images that render on iOS populate the cache for free; Android relies on `Image.getSize` (Android `onLoad` sizes are ignored).
- **Deferred native load for auto-size** — Glide/SDWebImage only load once a ratio exists, avoiding wrong Android center-crops.
- **Native-driver fade** — `transitionDuration` animates opacity off the JS thread.
- **Zero-overhead classic mode** — without new props, the render output is exactly one native FastImage.

## Feeds (FlatList / FlashList)

### 1. Prefetch sizes with your data

```tsx
const items = await fetchFeed();
await Promise.allSettled(
  items.map((item) => FastImage.prefetchSize({ uri: item.imageUrl }))
);
setItems(items); // every cell mounts at its final height
```

### 2. Always set `estimatedAspectRatio`

For any image that might not be prefetched, an estimate keeps layout stable and lets the native image load before the probe finishes:

```tsx
<FastImage
  source={{ uri }}
  style={{ width: '100%' }}
  autoHeight
  estimatedAspectRatio={4 / 3}
/>
```

If your API returns image dimensions (many CDNs do), pass the exact ratio — resolution becomes a no-op confirmation.

### 3. FlashList specifics

- The library is recycle-safe: stale results are never applied to a reused cell, and lifecycle state resets when the `source` changes.
- Give FlashList a sensible `estimatedItemSize` that matches your `estimatedAspectRatio`.

### 4. Pinterest / masonry layouts

Prefetch sizes first, then lay out columns from the resolved ratios:

```tsx
const sizes = await Promise.all(urls.map((uri) => FastImage.prefetchSize({ uri })));
const columns = distributeByAspectRatio(sizes); // your layout logic
```

## Memory

- The ratio cache is a bounded LRU (default 500 entries; a short string and three numbers each — a few tens of KB at the cap). Infinite feeds cannot grow it unboundedly.
- Native image memory is managed by Glide/SDWebImage exactly as with FastImage; `FastImage.clearMemoryCache()` behaves identically.

## Things to avoid

- **Don't** call `FastImage.clearSizeCache()` routinely — it forces re-resolution of everything. It exists for pull-to-refresh flows where images may have been replaced server-side behind unchanged URLs, or after upgrading past a poisoned-cache bug.
- **Don't** combine `autoHeight` with a fixed `style.height` — the fixed height wins and the resolution work is wasted (the library warns in dev).
- **Don't** omit `estimatedAspectRatio` on auto-sized list items — without it, Android waits for the probe before loading, which can look blank or delayed.
- **Don't** use `retryCount` as a connectivity strategy — it is for flaky CDNs. For offline handling, gate rendering on connectivity state instead.
