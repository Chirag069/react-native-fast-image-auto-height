# Migration guide

## From `react-native-fast-image` or `@d11/react-native-fast-image`

Change the import:

```diff
- import FastImage from 'react-native-fast-image';
- import FastImage from '@d11/react-native-fast-image';
+ import FastImage from 'react-native-fast-image-auto-height';
```

That is the entire migration. The following are guaranteed to work unchanged:

- **Props**: `source` (with `uri`, `headers`, `priority`, `cache`), `defaultSource`, `resizeMode`, `fallback`, `tintColor`, `blurRadius`, `transition`, `style`, `testID`, `children`, accessibility props
- **Events**: `onLoadStart`, `onProgress`, `onLoad`, `onError`, `onLoadEnd`, `onLayout`
- **Enums**: `FastImage.resizeMode`, `FastImage.priority`, `FastImage.cacheControl`, `FastImage.transition`
- **Statics**: `FastImage.preload(sources)`, `FastImage.clearMemoryCache()`, `FastImage.clearDiskCache()`
- **Types**: `FastImageProps`, `Source`, `ResizeMode`, `Priority`, `OnLoadEvent`, `OnProgressEvent`

When no new prop is used, the component renders exactly one native FastImage — no wrapper views, no behavior change, no performance difference.

### If you haven't installed the engine yet

`@d11/react-native-fast-image` is a peer dependency:

```sh
npm install @d11/react-native-fast-image
cd ios && pod install
```

If you were previously on the original `react-native-fast-image`, remove it — `@d11` is the maintained fork of the same native code:

```sh
npm uninstall react-native-fast-image
```

## From `react-native-auto-height-image`

```diff
- import AutoHeightImage from 'react-native-auto-height-image';
+ import FastImage from 'react-native-fast-image-auto-height';

- <AutoHeightImage width={width} source={{ uri }} />
+ <FastImage style={{ width }} source={{ uri }} autoHeight />
```

You gain native caching (Glide/SDWebImage), priority loading, headers, in-memory ratio caching, request deduplication and New Architecture support.

## Adopting the new capabilities incrementally

Every new prop is optional and additive. Adopt them one at a time:

```tsx
// Step 1: just migrate (zero behavior change)
<FastImage source={{ uri }} style={{ width: 200, height: 200 }} />

// Step 2: drop the hardcoded height
<FastImage source={{ uri }} style={{ width: 200 }} autoHeight />

// Step 3: kill layout jumps in lists
<FastImage source={{ uri }} style={{ width: 200 }} autoHeight estimatedAspectRatio={4 / 3} />

// Step 4: polish
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
