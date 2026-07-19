# Example app

Three screens demonstrating the library:

- **Feed** — a full-width FlatList feed with `autoHeight`, `estimatedAspectRatio`, skeleton placeholders, fade transitions and retries.
- **Pinterest** — a masonry grid: `FastImage.prefetchSize()` resolves every aspect ratio up front, columns are balanced by height, and every cell mounts at its final size.
- **Migration** — classic FastImage props copied verbatim, plus the incremental adoption path (`autoHeight`, fade, `onSizeResolved`).

## Dependencies

The example depends on:

- `react-native-fast-image` — native engine (peer of the library)
- `react-native-fast-image-auto-height` — resolved from the repository root via Metro (`metro.config.js`)

## Running

The example is a standard React Native app without committed native folders. Generate them once with the community template, then run:

```sh
cd example
npm install

# Generate ios/ and android/ from the RN template matching package.json's RN version
npx @react-native-community/cli init FastImageAutoHeightExample --skip-install --directory /tmp/rn-template
cp -R /tmp/rn-template/ios /tmp/rn-template/android .

cd ios && pod install && cd ..
npm run ios      # or: npm run android
```

If `npm install` fails on React peer ranges for `react-native-fast-image`, retry with `--legacy-peer-deps` (see the root [INSTALLATION.md](../docs/INSTALLATION.md)).

Metro is preconfigured (`metro.config.js`) to resolve `react-native-fast-image-auto-height` from the repository root, so library changes hot-reload into the app.
