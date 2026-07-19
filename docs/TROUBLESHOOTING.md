# Troubleshooting

## "Unable to resolve module react-native-fast-image"

The native engine is a peer dependency and must be installed by your app:

```sh
npm install react-native-fast-image
cd ios && pod install
```

If npm reports a React peer conflict (common with React 19), use `--legacy-peer-deps` or set `legacy-peer-deps=true` in `.npmrc`. See [INSTALLATION.md](./INSTALLATION.md).

## Images render but never get a height with `autoHeight`

Checklist:

1. **Is there a width?** `autoHeight` derives height from width. Provide a numeric `style.width`, a percentage, or a flex width.
2. **Is an explicit `style.height` set?** User styles win; remove the fixed height (the library warns about this in dev).
3. **Is the size probe failing?** Watch `onSizeResolved` / use `useImageDimensions` directly and check `status`. Auth-protected URLs need `source.headers` so `Image.getSizeWithHeaders` can probe them.
4. **Set `estimatedAspectRatio`** so layout (and the native load) can proceed before the probe finishes.

## Auto-sized image stays blank / loads late

The native image waits until a ratio is known. Without `estimatedAspectRatio` or a cache/prefetch hit, Android/iOS wait for `Image.getSize`. Fix: pass `estimatedAspectRatio`, or call `FastImage.prefetchSize()` while data loads.

## Layout jumps in lists

- Set `estimatedAspectRatio` on every auto-sized image.
- Prefetch sizes with `FastImage.prefetchSize()` while your feed data loads.
- See [PERFORMANCE.md](./PERFORMANCE.md).

## The size probe seems to download the image twice

`Image.getSize` uses React Native's image pipeline, which has a separate cache from Glide/SDWebImage. This can cause an extra fetch the *first* time a URL is probed before it renders. Once any image with that URL renders (or the probe completes), the ratio is cached and no further probes happen that session. If your API already returns image dimensions, pass `estimatedAspectRatio` with the exact value — the probe result then only confirms it.

## Android: some images look zoomed, others look fine (iOS all fine)

Two separate causes — both are handled by this library for **auto-sized** images:

1. **Auto-height race (Glide)** — Android was loading/center-cropping into a view before its height was known. Fix: defer the native load until a ratio is known; size with explicit height or Yoga `aspectRatio`; remount when the ratio settles; default `autoHeight` / `autoWidth` to `resizeMode="contain"`. Pass `resizeMode="cover"` only if you want cropping.
2. **Poisoned size cache** — FastImage's Android `onLoad` often reports view size. We ignore it and size from `Image.getSize`.

If you still see zoom after upgrading:

1. Call `FastImage.clearSizeCache()` once (or restart the app).
2. For `autoHeight` banners, set `estimatedAspectRatio` so the box is correct before the probe finishes.
3. Prefer React Native >= 0.86 for correct `Image.getSize` / EXIF handling.
4. **Fixed-size grid cards** (category tiles, product tiles) that do **not** use `autoHeight` still use FastImage's default `cover`. Mismatched image vs cell aspect ratio will crop — that is expected. Use `resizeMode="contain"` (or match the cell ratio) if you need the full image visible on every tile.

## Wrong dimensions for rotated (EXIF) JPEGs on Android

Fixed upstream in React Native 0.86 (`Image.getSize` now reads true source dimensions and honors EXIF rotation). On older RN versions, pass `estimatedAspectRatio` from your API when available, or upgrade.

## `onError` fires later than expected

With `retryCount > 0`, `onError` and `onLoadEnd` intentionally fire only after the **final** attempt fails. Intermediate failures are internal.

## Placeholder never disappears

The placeholder hides on the image's `onLoad`. If the URL 404s, the placeholder stays (by design — there is nothing to show). Handle `onError` to swap in an error state:

```tsx
const [failed, setFailed] = useState(false);
<FastImage
  source={{ uri }}
  placeholder={failed ? <ErrorState /> : <Skeleton />}
  onError={() => setFailed(true)}
/>;
```

## Jest: "Cannot find module react-native-fast-image" in app tests

Mock the engine in your Jest setup (this library's own test suite does the same):

```js
jest.mock('react-native-fast-image', () => {
  const React = require('react');
  const { Image } = require('react-native');
  const Mock = React.forwardRef((props, ref) =>
    React.createElement(Image, { ...props, ref })
  );
  Mock.resizeMode = { contain: 'contain', cover: 'cover', stretch: 'stretch', center: 'center' };
  Mock.priority = { low: 'low', normal: 'normal', high: 'high' };
  Mock.cacheControl = { immutable: 'immutable', web: 'web', cacheOnly: 'cacheOnly' };
  Mock.preload = jest.fn();
  Mock.clearMemoryCache = jest.fn(() => Promise.resolve());
  Mock.clearDiskCache = jest.fn(() => Promise.resolve());
  return { __esModule: true, default: Mock };
});
```

## Still stuck?

Open an issue with a minimal reproduction: https://github.com/Chirag069/react-native-fast-image-auto-height/issues
