# Migration guide

## From `react-native-fast-image`

Change the import:

```diff
- import FastImage from 'react-native-fast-image';
+ import FastImage from 'react-native-fast-image-auto-height';
```

That is the entire migration. The following are guaranteed to work unchanged when you use **no new props**:

- **Props**: `source` (with `uri`, `headers`, `priority`, `cache`), `defaultSource`, `resizeMode`, `fallback`, `tintColor`, `style`, `testID`, `children`, accessibility props
- **Events**: `onLoadStart`, `onProgress`, `onLoad`, `onError`, `onLoadEnd`, `onLayout`
- **Enums**: `FastImage.resizeMode`, `FastImage.priority`, `FastImage.cacheControl`
- **Statics**: `FastImage.preload(sources)`, `FastImage.clearMemoryCache()`, `FastImage.clearDiskCache()`
- **Types**: `FastImageProps`, `Source`, `ResizeMode`, `Priority`, `OnLoadEvent`, `OnProgressEvent`

When no new prop is used, the component renders exactly one native FastImage — no wrapper views, no behavior change, no performance difference. Classic mode still defaults `resizeMode` to `'cover'` (FastImage behavior).

### If you haven't installed the engine yet

`react-native-fast-image` is a peer dependency:

```sh
npm install react-native-fast-image
cd ios && pod install
```

### Coming from `@d11/react-native-fast-image`

This library peers on the original `react-native-fast-image` engine (not the Dream11 fork):

```sh
npm uninstall @d11/react-native-fast-image
npm install react-native-fast-image
cd ios && pod install
```

Then change the import to this library as above.

## From `react-native-auto-height-image`

```diff
- import AutoHeightImage from 'react-native-auto-height-image';
+ import FastImage from 'react-native-fast-image-auto-height';

- <AutoHeightImage width={width} source={{ uri }} />
+ <FastImage style={{ width }} source={{ uri }} autoHeight estimatedAspectRatio={4 / 3} />
```

You gain native caching (Glide/SDWebImage), priority loading, headers, in-memory ratio caching and request deduplication.

## Adopting the new capabilities incrementally

Every new prop is optional and additive. Adopt them one at a time:

```tsx
// Step 1: just migrate (zero behavior change)
<FastImage source={{ uri }} style={{ width: 200, height: 200 }} />

// Step 2: drop the hardcoded height
<FastImage source={{ uri }} style={{ width: 200 }} autoHeight estimatedAspectRatio={4 / 3} />

// Step 3: polish
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

### Behavior notes when enabling `autoHeight` / `autoWidth`

- `resizeMode` defaults to `'contain'` (not `'cover'`) so a slight ratio error letterboxes instead of zooming. Pass `resizeMode="cover"` if you want cropping.
- The native image does not load until a ratio is known (`estimatedAspectRatio`, cache hit, or size probe). Always prefer `estimatedAspectRatio` for jump-free, Android-safe layout.
- Fixed-size grid cards that do **not** use `autoHeight` still default to `'cover'` — mismatched image vs cell aspect ratio will crop. Use `contain` or match the cell ratio if you need the full image on every tile.
