# Installation

## Requirements

- React Native >= 0.71
- `react-native-fast-image` >= 8.6.0 (peer dependency — native engine)
- React 17, 18, or 19 (React 19 may need `legacy-peer-deps` — see below)

## Steps

```sh
npm install react-native-fast-image-auto-height react-native-fast-image
# or
yarn add react-native-fast-image-auto-height react-native-fast-image
```

### iOS

```sh
cd ios && pod install
```

### Android

Nothing extra — autolinking handles the native module.

### React 19 / peer dependency conflicts

`react-native-fast-image@8.6.x` declares `peerDependencies.react` as `^17 || ^18` only. With React 19, npm may report `ERESOLVE`. Install with:

```sh
npm install react-native-fast-image-auto-height react-native-fast-image --legacy-peer-deps
```

Or add to your app's `.npmrc`:

```
legacy-peer-deps=true
```

## Why is the native engine a peer dependency?

1. **No duplicate native modules** — your app and this library must share one `react-native-fast-image` install.
2. **You control the native version** — bump the peer when you need engine fixes.

This library has **zero native code** of its own. It is a TypeScript layer (auto-size, cache, retries, placeholders, transitions) over Glide/SDWebImage via `react-native-fast-image`.

## Expo

Works in Expo development builds and bare workflow. Not supported in Expo Go (no custom native modules).

## Verifying the install

```tsx
import FastImage from 'react-native-fast-image-auto-height';

<FastImage
  source={{ uri: 'https://picsum.photos/400/300' }}
  style={{ width: '100%' }}
  autoHeight
  estimatedAspectRatio={4 / 3}
/>;
```

If the image renders and sizes itself, the install is correct.
