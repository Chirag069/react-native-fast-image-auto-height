# Troubleshooting

## "Unable to resolve module @d11/react-native-fast-image"

The native engine is a peer dependency and must be installed by your app:

```sh
npm install @d11/react-native-fast-image
cd ios && pod install
```

## Images render but never get a height with `autoHeight`

Checklist:

1. **Is there a width?** `autoHeight` derives height from width. Provide a numeric `style.width`, a percentage, or a flex width. With no width at all there is nothing to derive from.
2. **Is an explicit `style.height` set?** User styles win; remove the fixed height (the library warns about this in dev).
3. **Is the size probe failing?** Watch `onSizeResolved` / use `useImageDimensions` directly and check `status`. Auth-protected URLs need `source.headers` so `Image.getSizeWithHeaders` can probe them.
4. **Set `estimatedAspectRatio`** so layout is sane even while resolution is pending or failed.

## Layout jumps in lists

- Set `estimatedAspectRatio` on every auto-sized image.
- Prefetch sizes with `FastImage.prefetchSize()` while your feed data loads.
- See [PERFORMANCE.md](./PERFORMANCE.md).

## The size probe seems to download the image twice

`Image.getSize` uses React Native's image pipeline, which has a separate cache from Glide/SDWebImage. This can cause an extra fetch the *first* time a URL is probed before it renders. Once any image with that URL renders (or the probe completes), the ratio is cached and no further probes happen that session. If your API already returns image dimensions, pass `estimatedAspectRatio` with the exact value — the probe result then only confirms it.

## Wrong dimensions for rotated (EXIF) JPEGs on Android

Fixed upstream in React Native 0.86 (`Image.getSize` now reads true source dimensions and honors EXIF rotation). On older RN versions, prefer the `onLoad` path (just render the image) or upgrade.

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

## Jest: "Cannot find module @d11/react-native-fast-image" in app tests

Mock the engine in your Jest setup (this library's own test suite does the same):

```js
jest.mock('@d11/react-native-fast-image', () => {
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

Open an issue with a minimal reproduction: https://github.com/chiragramani/react-native-fast-image-auto-height/issues
