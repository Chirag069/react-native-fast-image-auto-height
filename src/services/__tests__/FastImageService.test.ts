import { Image } from 'react-native';
import { FastImageService } from '../FastImageService';
import { nativeFastImageStatics } from '../../components/InternalFastImage';

type SuccessCb = (width: number, height: number) => void;

describe('FastImageService', () => {
  beforeEach(() => {
    FastImageService.clearSizeCache();
    jest.clearAllMocks();
  });

  it('delegates preload to the native engine', () => {
    const sources = [{ uri: 'https://a.com/1.jpg' }];
    FastImageService.preload(sources);
    expect(nativeFastImageStatics.preload).toHaveBeenCalledWith(sources);
  });

  it('delegates cache clearing to the native engine', async () => {
    await FastImageService.clearMemoryCache();
    await FastImageService.clearDiskCache();
    expect(nativeFastImageStatics.clearMemoryCache).toHaveBeenCalledTimes(1);
    expect(nativeFastImageStatics.clearDiskCache).toHaveBeenCalledTimes(1);
  });

  it('prefetchSize warms the aspect-ratio cache', async () => {
    const getSize = jest
      .spyOn(Image, 'getSize')
      .mockImplementation((_uri, onSuccess) => {
        (onSuccess as SuccessCb)(120, 60);
      });

    const result = await FastImageService.prefetchSize({
      uri: 'https://a.com/prefetch.jpg',
    });
    expect(result.aspectRatio).toBe(2);

    // Second resolution is a synchronous cache hit — no extra probe.
    const again = await FastImageService.prefetchSize({
      uri: 'https://a.com/prefetch.jpg',
    });
    expect(again.fromCache).toBe(true);
    expect(getSize).toHaveBeenCalledTimes(1);
    getSize.mockRestore();
  });

  it('clearSizeCache forces re-resolution', async () => {
    const getSize = jest
      .spyOn(Image, 'getSize')
      .mockImplementation((_uri, onSuccess) => {
        (onSuccess as SuccessCb)(10, 10);
      });

    await FastImageService.prefetchSize({ uri: 'https://a.com/c.jpg' });
    FastImageService.clearSizeCache();
    await FastImageService.prefetchSize({ uri: 'https://a.com/c.jpg' });
    expect(getSize).toHaveBeenCalledTimes(2);
    getSize.mockRestore();
  });
});
