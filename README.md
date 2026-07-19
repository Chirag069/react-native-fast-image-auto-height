# react-native-fast-image-auto-height

**The definitive FastImage successor.** FastImage performance and 100% API compatibility, plus the features FastImage never shipped: automatic height/width calculation, aspect-ratio caching, request deduplication, retries, placeholders, fade transitions and lazy loading.

[![npm version](https://img.shields.io/npm/v/react-native-fast-image-auto-height.svg)](https://www.npmjs.com/package/react-native-fast-image-auto-height)
[![license](https://img.shields.io/npm/l/react-native-fast-image-auto-height.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](./tsconfig.json)

- ✅ **Drop-in FastImage replacement** — migration is one import line
- ✅ **Auto height / auto width** from the image's intrinsic aspect ratio
- ✅ **FastImage performance** — Glide (Android) / SDWebImage (iOS) via [`react-native-fast-image`](https://github.com/DylanVann/react-native-fast-image)
- ✅ **Android-safe auto-sizing** — defers native load until a ratio is known; defaults `autoHeight` / `autoWidth` to `contain`
- ✅ **New Architecture ready** — Fabric + TurboModules (subject to engine support)
- ✅ **In-memory aspect-ratio cache** with LRU eviction — a URL is measured once per session
- ✅ **Promise deduplication** — 100 cells asking for the same image trigger exactly one size probe
- ✅ **Retries, placeholders, fade transitions, lazy loading**
- ✅ **Strict TypeScript**, every public type exported
- ✅ Built for **FlatList, FlashList, Pinterest/masonry layouts and infinite feeds**

## Why this package exists

No other library provides all of this at once:

| Capability | `react-native-fast-image` | `react-native-auto-height-image` | **this package** |
| --- | :-: | :-: | :-: |
| Native caching (Glide / SDWebImage) | ✅ | ❌ (RN `Image`) | ✅ |
| Automatic height | ❌ | ✅ | ✅ |
| Automatic width | ❌ | ❌ | ✅ |
| Aspect-ratio caching + dedup | ❌ | ⚠️ | ✅ |
| Retries / placeholder / transition / lazy | ❌ | ❌ | ✅ |
| Strict TypeScript, typed public API | ⚠️ | ⚠️ | ✅ |

## Installation

```sh
npm install react-native-fast-image-auto-height react-native-fast-image
# or
yarn add react-native-fast-image-auto-height react-native-fast-image
```

`react-native-fast-image` (>= 8.6.0) is a peer dependency — it is the native engine; this library is the intelligence layer on top. Then:

```sh
cd ios && pod install
```

Requires React Native >= 0.71. Works on the New Architecture and the legacy renderer (subject to engine support).

> **Note:** `react-native-fast-image@8.6.x` peers React 17/18 only. If your app uses React 19, install with `legacy-peer-deps` (this repo ships an `.npmrc` for that).

## Migration from FastImage

Change the import. Done.

```diff
- import FastImage from 'react-native-fast-image';
+ import FastImage from 'react-native-fast-image-auto-height';
```

Every prop, enum (`FastImage.resizeMode`, `FastImage.priority`, `FastImage.cacheControl`), event and static (`preload`, `clearMemoryCache`, `clearDiskCache`) works unchanged. See [docs/MIGRATION.md](./docs/MIGRATION.md).

## Usage

### Classic FastImage (unchanged)

```tsx
import FastImage from 'react-native-fast-image-auto-height';

<FastImage
  style={{ width: 200, height: 200 }}
  source={{
    uri: 'https://unsplash.it/400/400?image=1',
    headers: { Authorization: 'someAuthToken' },
    priority: FastImage.priority.normal,
  }}
  resizeMode={FastImage.resizeMode.contain}
/>;
```

### Automatic height

```tsx
<FastImage
  source={{ uri: 'https://example.com/photo.jpg' }}
  style={{ width: '100%' }}
  autoHeight
  estimatedAspectRatio={4 / 3} // provisional layout before the size is known (recommended)
  onSizeResolved={({ width, height, aspectRatio, fromCache }) => {
    console.log(`intrinsic size ${width}x${height}`);
  }}
/>
```

Size resolution order:

1. In-memory aspect-ratio cache (synchronous)
2. `estimatedAspectRatio` (provisional layout; also lets the native image load)
3. `Image.getSize` / `Image.getSizeWithHeaders` (deduplicated probe) — **source of truth on Android**
4. FastImage `onLoad` dimensions — **iOS only** (Android `onLoad` often reports view size and is ignored)

Numeric `style.width` → explicit pixel height. Percentage/flex width → Yoga `aspectRatio`. Once resolved, every future render of that URL is synchronous.

With `autoHeight` / `autoWidth`, `resizeMode` defaults to `contain` (pass `cover` explicitly if you want cropping).

### Automatic width

```tsx
<FastImage
  source={{ uri: 'https://example.com/photo.jpg' }}
  style={{ height: 240 }}
  autoWidth
/>
```

### Placeholder, transition, retries, lazy

```tsx
<FastImage
  source={{ uri: 'https://example.com/photo.jpg' }}
  style={{ width: '100%' }}
  autoHeight
  estimatedAspectRatio={4 / 3}
  placeholder={<Skeleton />}         // any node, or an image source
  transitionDuration={200}           // fade-in on load (ms)
  retryCount={3}                     // retry failed loads
  retryDelay={500}                   // ms between retries
  lazy                               // defer load until the JS thread is idle
/>
```

### Feeds: prefetch sizes for jump-free lists

```tsx
// While your feed data loads, warm the ratio cache:
await Promise.all(items.map((item) => FastImage.prefetchSize({ uri: item.imageUrl })));

// Every list cell now mounts at its final height — zero layout jumps.
<FlashList
  data={items}
  renderItem={({ item }) => (
    <FastImage
      source={{ uri: item.imageUrl }}
      style={{ width: '100%' }}
      autoHeight
      estimatedAspectRatio={4 / 3}
    />
  )}
/>;
```

### Hooks — build your own image components

```tsx
import { useImageDimensions, useAutoHeight } from 'react-native-fast-image-auto-height';

const { aspectRatio, status } = useImageDimensions({ uri });
const height = useAutoHeight({ enabled: true, width: 300, aspectRatio });
```

### Global defaults

```tsx
import { FastImageConfigProvider } from 'react-native-fast-image-auto-height';

<FastImageConfigProvider config={{ retryCount: 2, transitionDuration: 150 }}>
  <App />
</FastImageConfigProvider>;
```

## API

All FastImage props plus:

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `autoHeight` | `boolean` | `false` | Compute height from width × intrinsic aspect ratio |
| `autoWidth` | `boolean` | `false` | Compute width from height × intrinsic aspect ratio |
| `estimatedAspectRatio` | `number` | — | Provisional `width / height` before resolution (recommended for auto-size) |
| `onSizeResolved` | `(size) => void` | — | Fired once when the intrinsic size is known |
| `placeholder` | `ReactNode \| Source \| number` | — | Shown while loading |
| `transitionDuration` | `number` | `0` | Fade-in duration in ms (`0` = off, classic behavior) |
| `retryCount` | `number` | `0` | Load retries (`0` = classic behavior) |
| `retryDelay` | `number` | `250` | Delay between retries in ms |
| `lazy` | `boolean` | `false` | Defer load until the JS thread is idle |

`resizeMode` defaults to `'cover'` in classic mode, and to `'contain'` when `autoHeight` / `autoWidth` is enabled (unless you pass it explicitly).

New statics: `FastImage.prefetchSize(source)`, `FastImage.clearSizeCache()`.

Full reference: [docs/API.md](./docs/API.md).

## Documentation

- [Installation](./docs/INSTALLATION.md)
- [Migration guide](./docs/MIGRATION.md)
- [API reference](./docs/API.md)
- [Architecture](./docs/ARCHITECTURE.md)
- [Performance guide](./docs/PERFORMANCE.md)
- [FAQ](./docs/FAQ.md)
- [Troubleshooting](./docs/TROUBLESHOOTING.md)

## Design decisions worth knowing

- **Memory-only size cache.** Aspect ratios live in an in-memory LRU only (no disk). Persisting them would break layouts when a CDN replaces an image behind the same URL.
- **One native seam.** Exactly one file imports `react-native-fast-image` (`InternalFastImage.tsx`).
- **User styles always win.** `autoHeight` never overrides an explicit `style.height`.
- **Android sizes from `Image.getSize`.** FastImage's Android `onLoad` dimensions are ignored (they often report view size). Auto-sized images do not load until a ratio is known.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Issues and PRs welcome.

## License

[MIT](./LICENSE)
