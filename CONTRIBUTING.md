# Contributing

Thanks for helping make this the definitive FastImage successor. Contributions of all kinds are welcome: bug reports, docs, tests, features.

## Development setup

```sh
git clone https://github.com/Chirag069/react-native-fast-image-auto-height.git
cd react-native-fast-image-auto-height
npm install
```

The repo includes `.npmrc` with `legacy-peer-deps=true` because `react-native-fast-image@8.6.x` peers React 17/18 while this package develops against modern React Native / React 19.

Useful commands:

```sh
npm run typecheck   # strict TypeScript
npm run lint        # ESLint (includes architecture layer rules)
npm test            # Jest
npm run release     # full pipeline: clean + typecheck + lint + test + build
```

## Architecture rules (enforced by lint)

Please read [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) before writing code. The short version:

- Layers flow downward only: `components → hooks → services → managers → cache`.
- `Image.getSize` may only be called in `src/utils/getImageSize.ts`; everything goes through `ImageSizeService`.
- Only `src/components/InternalFastImage.tsx` may import `react-native-fast-image`.
- No `any`, no `ts-ignore`, no `eslint-disable`.
- Business logic lives in services; hooks have one responsibility; utilities are pure functions.

## Platform notes (must stay documented)

- Android: do not harvest FastImage `onLoad` dimensions into the size cache (view-size poison). Size via `Image.getSize`.
- Auto-size: do not load the native image until a ratio is known; default `resizeMode` to `contain`.
- Keep [README.md](./README.md) and everything under [docs/](./docs/) in sync when behavior changes.

## API stability

The FastImage-compatible prop surface is **frozen** — never rename or change the semantics of an existing FastImage prop. New capabilities must be additive and optional, with behavior identical to classic FastImage when omitted.

## Pull requests

1. Fork and create a feature branch.
2. Add tests for any behavior change — the suite must pass (`npm test`).
3. Keep `npm run typecheck` and `npm run lint` clean.
4. Update relevant docs (`README.md`, `docs/`) and add a `CHANGELOG.md` entry under an `Unreleased` heading.
5. Open the PR with a clear description of the problem and the approach.

Small, focused PRs merge fastest.

## Reporting bugs

Use the bug-report issue template and include a minimal reproduction (an Expo Snack or a small repo is ideal), plus your React Native, `react-native-fast-image` and library versions. Note whether the issue is on Android, iOS, or both.

## Code of conduct

This project follows the [Contributor Covenant](./CODE_OF_CONDUCT.md). Be kind.
