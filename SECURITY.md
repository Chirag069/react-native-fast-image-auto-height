# Security Policy

## Supported versions

| Version | Supported |
| --- | --- |
| 1.x | ✅ |

## Reporting a vulnerability

Please **do not** open a public issue for security vulnerabilities.

Instead, use GitHub's private vulnerability reporting on this repository
("Security" tab → "Report a vulnerability"), or contact the maintainer
directly.

You can expect an acknowledgement within 72 hours. Once triaged, we will work
with you on a fix and coordinated disclosure. Credit is given in the release
notes unless you prefer otherwise.

## Scope notes

This library contains no native code and makes no network requests of its own
beyond delegating image loading to the peer dependency
[`react-native-fast-image`](https://github.com/DylanVann/react-native-fast-image)
(Glide / SDWebImage) and size probes to React Native's `Image.getSize` /
`Image.getSizeWithHeaders`. Reports about those layers should also be raised
upstream with the respective projects.
