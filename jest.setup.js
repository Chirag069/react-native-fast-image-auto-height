/* eslint-env jest */

// The native FastImage engine is mocked in all tests: unit tests exercise the
// pure TS layers directly, and component tests only need a render-compatible stub.
jest.mock('react-native-fast-image', () => {
  const React = require('react');
  const { Image, View } = require('react-native');

  const MockFastImage = React.forwardRef((props, ref) => {
    const { source, tintColor, ...rest } = props;
    return React.createElement(Image, {
      ...rest,
      ref,
      source: typeof source === 'number' ? source : { uri: source?.uri },
      testID: props.testID,
    });
  });
  MockFastImage.displayName = 'MockFastImage';

  MockFastImage.resizeMode = {
    contain: 'contain',
    cover: 'cover',
    stretch: 'stretch',
    center: 'center',
  };
  MockFastImage.priority = {
    low: 'low',
    normal: 'normal',
    high: 'high',
  };
  MockFastImage.cacheControl = {
    immutable: 'immutable',
    web: 'web',
    cacheOnly: 'cacheOnly',
  };
  MockFastImage.preload = jest.fn();
  MockFastImage.clearMemoryCache = jest.fn(() => Promise.resolve());
  MockFastImage.clearDiskCache = jest.fn(() => Promise.resolve());

  return {
    __esModule: true,
    default: MockFastImage,
    View,
  };
});
