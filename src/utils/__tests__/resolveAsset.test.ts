import { Image } from 'react-native';
import { resolveAsset } from '../resolveAsset';

describe('resolveAsset', () => {
  const resolveAssetSource = jest.spyOn(Image, 'resolveAssetSource');

  afterEach(() => {
    resolveAssetSource.mockReset();
  });

  it('returns the dimensions of a resolvable local asset', () => {
    resolveAssetSource.mockReturnValue({
      uri: 'asset',
      width: 120,
      height: 80,
      scale: 2,
    });
    expect(resolveAsset(1)).toEqual({ width: 120, height: 80 });
  });

  it('returns null when the asset cannot be resolved', () => {
    resolveAssetSource.mockReturnValue(
      undefined as unknown as ReturnType<typeof Image.resolveAssetSource>
    );
    expect(resolveAsset(999)).toBeNull();
  });

  it('returns null when the asset has no usable dimensions', () => {
    resolveAssetSource.mockReturnValue({
      uri: 'asset',
      width: 0,
      height: 0,
      scale: 1,
    });
    expect(resolveAsset(1)).toBeNull();
  });
});
