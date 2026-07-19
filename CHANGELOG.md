# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project
adheres to [Semantic Versioning](https://semver.org/).

## [1.0.0] - 2026-07-19

### Added

- 100% FastImage-compatible `<FastImage />` component (props, events, enums, statics identical to `react-native-fast-image`).
- `autoHeight` / `autoWidth`: automatic dimension calculation from the intrinsic aspect ratio, with numeric, percentage and flex sizes supported.
- `estimatedAspectRatio` for jump-free provisional layout.
- `onSizeResolved` callback with intrinsic dimensions, aspect ratio and cache provenance.
- `placeholder` (any React node or image source), `transitionDuration` (native-driver fade), `retryCount` / `retryDelay` (transparent load retries), `lazy` (idle-deferred loading).
- In-memory LRU aspect-ratio cache with promise deduplication: one size probe per URL, shared across all subscribers.
- `FastImage.prefetchSize()` and `FastImage.clearSizeCache()` statics.
- Public hooks: `useImageDimensions`, `useAutoHeight`, `useAutoWidth`.
- `FastImageConfigProvider` for app-wide defaults.
- Pluggable `SizeCacheStorage` interface (write-through) reserved for future persistence plugins.
- Strict TypeScript throughout; every public type exported.
