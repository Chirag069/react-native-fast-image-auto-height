# react-native-fast-image-auto-height

**FastImage + automatic height/width.** Same API and native performance (Glide / SDWebImage), with jump-free auto-sizing, caching, retries, placeholders, and fade transitions.

[![npm version](https://img.shields.io/npm/v/react-native-fast-image-auto-height.svg)](https://www.npmjs.com/package/react-native-fast-image-auto-height)
[![license](https://img.shields.io/npm/l/react-native-fast-image-auto-height.svg)](./LICENSE)

```diff
- import FastImage from 'react-native-fast-image';
+ import FastImage from 'react-native-fast-image-auto-height';
```

---

## Features

| | Feature | What you get |
| --- | --- | --- |
| 🖼️ | **Drop-in FastImage** | Same props, events, enums, and statics — change only the import |
| 📐 | **`autoHeight` / `autoWidth`** | Height or width from the real aspect ratio; works with numeric, `%`, and flex sizes |
| ⚡ | **Native performance** | Glide (Android) + SDWebImage (iOS) via [`react-native-fast-image`](https://github.com/DylanVann/react-native-fast-image) |
| 🧠 | **Aspect-ratio cache** | In-memory LRU — each URL is measured once per session |
| 🔁 | **Request deduplication** | Many cells, one `Image.getSize` probe |
| 🦴 | **Placeholder** | Any React node, remote source, or `require(...)` while loading |
| ✨ | **Fade transition** | `transitionDuration` on the native animation driver |
| 🔄 | **Retries** | `retryCount` / `retryDelay` for flaky CDNs |
| 💤 | **Lazy load** | Defer until the JS thread is idle |
| 📜 | **List-ready** | FlatList / FlashList / masonry — `prefetchSize` for zero layout jumps |
| 🧩 | **Hooks + config** | `useImageDimensions`, `useAutoHeight`, `useAutoWidth`, `FastImageConfigProvider` |

### Compared to alternatives

| | `react-native-fast-image` | `react-native-auto-height-image` | **`react-native-fast-image-auto-height`** |
| --- | :-: | :-: | :-: |
| Native cache (Glide / SDWebImage) | ✅ | ❌ | ✅ |
| Auto height | ❌ | ✅ | ✅ |
| Auto width | ❌ | ❌ | ✅ |
| Ratio cache + dedup | ❌ | ⚠️ | ✅ |
| Placeholder / fade / retry / lazy | ❌ | ❌ | ✅ |

---

## Why use `react-native-fast-image-auto-height`?

Other libraries solve **one** half of the problem. This package is the only one that keeps FastImage’s native pipeline **and** adds production auto-sizing on top.

| If you use… | You get… | You miss… |
| --- | --- | --- |
| **`react-native-fast-image` alone** | Fast native caching, priorities, headers | Auto height/width — you hardcode sizes or fight layout jumps in feeds |
| **`react-native-auto-height-image` alone** | Auto height from aspect ratio | Glide/SDWebImage — uses RN `Image`, slower cache, no FastImage API |
| **Rolling your own** | Custom hacks around `Image.getSize` | Dedup, LRU ratio cache, retries, placeholders |

**What only this package does together:**

1. **One import migration** — keep every FastImage prop/event/static; add `autoHeight` when you need it.
2. **Jump-free lists** — `estimatedAspectRatio` + `prefetchSize` + in-memory LRU so FlatList/FlashList cells mount at final height.
3. **One probe per URL** — 100 cells asking for the same image share a single size request.
4. **UX extras on the same component** — placeholder, fade, retries, lazy — without wrapping FastImage yourself.

Use it when you want **FastImage performance** and **auto-sized layouts** without stitching two libraries (or custom sizing code) together.

---

## Install

```sh
npm install react-native-fast-image-auto-height react-native-fast-image
cd ios && pod install
```

| Requirement | Version |
| --- | --- |
| React Native | >= 0.71 |
| Peer engine | `react-native-fast-image` >= 8.6.0 |

React 19: use `--legacy-peer-deps` if npm reports a peer conflict (see [Installation](./docs/INSTALLATION.md)).

---

## Quick start

### Classic FastImage

```tsx
import FastImage from 'react-native-fast-image-auto-height';

<FastImage
  style={{ width: 200, height: 200 }}
  source={{
    uri: 'https://unsplash.it/400/400?image=1',
    priority: FastImage.priority.normal,
  }}
  resizeMode={FastImage.resizeMode.contain}
/>;
```

### Auto height (recommended pattern)

```tsx
<FastImage
  source={{ uri: 'https://example.com/photo.jpg' }}
  style={{ width: '100%' }}
  autoHeight
  estimatedAspectRatio={4 / 3}
  placeholder={<Skeleton />}
  transitionDuration={200}
/>
```

### Feeds without layout jumps

```tsx
await Promise.all(
  items.map((item) => FastImage.prefetchSize({ uri: item.imageUrl }))
);

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

### Hooks & global defaults

```tsx
import {
  useImageDimensions,
  useAutoHeight,
  FastImageConfigProvider,
} from 'react-native-fast-image-auto-height';

const { aspectRatio } = useImageDimensions({ uri });
const height = useAutoHeight({ enabled: true, width: 300, aspectRatio });

<FastImageConfigProvider config={{ retryCount: 2, transitionDuration: 150 }}>
  <App />
</FastImageConfigProvider>;
```

---

## Auto-size API

| Prop | Default | Description |
| --- | --- | --- |
| `autoHeight` | `false` | Derive height from width × aspect ratio |
| `autoWidth` | `false` | Derive width from height × aspect ratio |
| `estimatedAspectRatio` | — | Provisional `width / height` (recommended) |
| `onSizeResolved` | — | Called once when intrinsic size is known |
| `placeholder` | — | Node or image source while loading |
| `transitionDuration` | `0` | Fade-in ms (`0` = off) |
| `retryCount` | `0` | Load retries |
| `retryDelay` | `250` | Delay between retries (ms) |
| `lazy` | `false` | Load when the JS thread is idle |

**Statics:** `FastImage.prefetchSize(source)` · `FastImage.clearSizeCache()`  
(+ all classic FastImage statics: `preload`, `clearMemoryCache`, `clearDiskCache`, enums)

**Defaults worth knowing**

- Classic mode → `resizeMode="cover"`
- `autoHeight` / `autoWidth` → `resizeMode="contain"` (override with `cover` if you want crop)
- Size cache → **memory LRU only** (no disk)

Full reference: [docs/API.md](./docs/API.md)

---

## Docs

| Guide | |
| --- | --- |
| [Installation](./docs/INSTALLATION.md) | Setup, peers, Expo |
| [Migration](./docs/MIGRATION.md) | From FastImage or auto-height-image |
| [API](./docs/API.md) | Props, statics, hooks, types |
| [Architecture](./docs/ARCHITECTURE.md) | Layers, sizing, cache |
| [Performance](./docs/PERFORMANCE.md) | Feeds, prefetch, lists |
| [FAQ](./docs/FAQ.md) | Common questions |
| [Troubleshooting](./docs/TROUBLESHOOTING.md) | Android zoom, blank load, Jest |

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

[MIT](./LICENSE)
