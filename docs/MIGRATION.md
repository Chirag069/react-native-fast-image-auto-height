# Migration guide

## From `react-native-fast-image`

This library’s peer engine is `react-native-fast-image`. Migration is one import change:

```diff
- import FastImage from 'react-native-fast-image';
+ import FastImage from 'react-native-fast-image-auto-height';
```

Keep `react-native-fast-image` installed as a peer dependency:

```sh
npm install react-native-fast-image-auto-height react-native-fast-image
cd ios && pod install
```

When you use **no new props**, the following work unchanged:

- **Props**: `source` (with `uri`, `headers`, `priority`, `cache`), `defaultSource`, `resizeMode`, `fallback`, `tintColor`, `blurRadius`, `style`, `testID`, `children`, accessibility props
- **Events**: `onLoadStart`, `onProgress`, `onLoad`, `onError`, `onLoadEnd`, `onLayout`
- **Enums**: `FastImage.resizeMode`, `FastImage.priority`, `FastImage.cacheControl`
- **Statics**: `FastImage.preload(sources)`, `FastImage.clearMemoryCache()`, `FastImage.clearDiskCache()`
- **Types**: `FastImageProps`, `Source`, `ResizeMode`, `Priority`, `OnLoadEvent`, `OnProgressEvent`

Classic mode (no auto-size props) renders exactly one native FastImage and defaults `resizeMode` to `'cover'`.

## From `react-native-auto-height-image`

```diff
- import AutoHeightImage from 'react-native-auto-height-image';
+ import FastImage from 'react-native-fast-image-auto-height';

- <AutoHeightImage width={width} source={{ uri }} />
+ <FastImage style={{ width }} source={{ uri }} autoHeight estimatedAspectRatio={4 / 3} />
```

You gain native caching (Glide/SDWebImage), priority loading, headers, in-memory ratio caching and request deduplication.

## Adopting auto-size and extras

Every new prop is optional. Adopt them one at a time:

```tsx
// Step 1: migrate import only (zero behavior change)
<FastImage source={{ uri }} style={{ width: 200, height: 200 }} />

// Step 2: auto height
<FastImage
  source={{ uri }}
  style={{ width: 200 }}
  autoHeight
  estimatedAspectRatio={4 / 3}
/>

// Step 3: placeholder, fade, retries
<FastImage
  source={{ uri }}
  style={{ width: 200 }}
  autoHeight
  estimatedAspectRatio={4 / 3}
  placeholder={<Skeleton />}
  transitionDuration={200}
  retryCount={2}
/>
```

### Current auto-size behavior

- `resizeMode` defaults to `'contain'` when `autoHeight` / `autoWidth` is on (classic mode stays `'cover'`).
- The native image loads only after a ratio is known (`estimatedAspectRatio`, cache, or `Image.getSize`). Prefer `estimatedAspectRatio`.
- Numeric width → pixel height; percentage/flex width → Yoga `aspectRatio`.
- Size cache is **in-memory LRU only** (no disk).
- Fixed-size grid cards without `autoHeight` still use `'cover'` — use `resizeMode="contain"` if tiles must show the full image.
