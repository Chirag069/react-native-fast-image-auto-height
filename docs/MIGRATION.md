# Migration guide

## From `react-native-fast-image`

Change the import:

```diff
- import FastImage from 'react-native-fast-image';
+ import FastImage from 'react-native-fast-image-auto-height';
```

That is the entire migration. The following are guaranteed to work unchanged:

- **Props**: `source` (with `uri`, `headers`, `priority`, `cache`), `defaultSource`, `resizeMode`, `fallback`, `tintColor`, `style`, `testID`, `children`, accessibility props
- **Events**: `onLoadStart`, `onProgress`, `onLoad`, `onError`, `onLoadEnd`, `onLayout`
- **Enums**: `FastImage.resizeMode`, `FastImage.priority`, `FastImage.cacheControl`
- **Statics**: `FastImage.preload(sources)`, `FastImage.clearMemoryCache()`, `FastImage.clearDiskCache()`
- **Types**: `FastImageProps`, `Source`, `ResizeMode`, `Priority`, `OnLoadEvent`, `OnProgressEvent`

When no new prop is used, the component renders exactly one native FastImage — no wrapper views, no behavior change, no performance difference.

### If you haven't installed the engine yet

`react-native-fast-image` is a peer dependency:

```sh
npm install react-native-fast-image
cd ios && pod install
```

### Coming from `@d11/react-native-fast-image`

Remove the Dream11 fork and install the original engine:

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
