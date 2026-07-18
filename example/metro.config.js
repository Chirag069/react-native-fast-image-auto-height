const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const root = path.resolve(__dirname, '..');

/**
 * Resolves `react-native-fast-image-auto-height` to the library source in
 * the repository root, so changes are picked up live while developing.
 */
module.exports = mergeConfig(getDefaultConfig(__dirname), {
  watchFolders: [root],
  resolver: {
    extraNodeModules: {
      'react-native-fast-image-auto-height': root,
    },
    // Always use the example app's copies of shared packages.
    blockList: [
      new RegExp(`${root.replace(/[/\\]/g, '[/\\\\]')}[/\\\\]node_modules[/\\\\]react-native[/\\\\].*`),
      new RegExp(`${root.replace(/[/\\]/g, '[/\\\\]')}[/\\\\]node_modules[/\\\\]react[/\\\\].*`),
    ],
  },
});
