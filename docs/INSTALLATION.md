# Installation

## Requirements

- React Native >= 0.71 (New Architecture and legacy renderer both supported, subject to engine support)
- `react-native-fast-image` >= 8.6.0 (the native engine, a peer dependency)
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

Two reasons, both deliberate:

1. **No duplicate native modules.** If your app (or another library) already uses `react-native-fast-image`, a bundled copy would collide at the native level. A peer dependency guarantees exactly one native module.
2. **You control the native version.** Native upgrades land in your app the moment you bump the peer — no waiting for this library to re-release.

This library contains **zero native code** of its own: it is a typed intelligence layer (sizing, caching, deduplication, retries, transitions) over the Glide/SDWebImage engine provided by `react-native-fast-image`.

## Coming from `@d11/react-native-fast-image`

```sh
npm uninstall @d11/react-native-fast-image
npm install react-native-fast-image
cd ios && pod install
```

Then import this library instead of the Dream11 fork (see [MIGRATION.md](./MIGRATION.md)).

## Expo

Works in Expo development builds and bare workflow (any workflow that supports native modules). Not supported in Expo Go, because Expo Go cannot load the FastImage native module.

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

If the image renders and sizes itself, everything is wired correctly. Prefer `estimatedAspectRatio` so Android has a definite box before the native image loads.
