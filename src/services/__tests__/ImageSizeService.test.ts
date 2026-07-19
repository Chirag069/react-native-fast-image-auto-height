import { Image, Platform } from 'react-native';
import { ImageSizeService } from '../ImageSizeService';

type SuccessCb = (width: number, height: number) => void;
type FailureCb = (error: unknown) => void;

describe('ImageSizeService', () => {
  const getSize = jest.spyOn(Image, 'getSize');
  const getSizeWithHeaders = jest.spyOn(Image, 'getSizeWithHeaders');
  const resolveAssetSource = jest.spyOn(Image, 'resolveAssetSource');

  beforeEach(() => {
    ImageSizeService.clearCache();
  });

  afterEach(() => {
    getSize.mockReset();
    getSizeWithHeaders.mockReset();
    resolveAssetSource.mockReset();
  });

  describe('remote sources', () => {
    it('resolves dimensions and aspect ratio via a single probe', async () => {
      getSize.mockImplementation((_uri, onSuccess) => {
        (onSuccess as SuccessCb)(400, 200);
      });

      const result = await ImageSizeService.resolve({
        uri: 'https://a.com/1.jpg',
      });
      expect(result).toEqual({
        width: 400,
        height: 200,
        aspectRatio: 2,
        fromCache: false,
      });
    });

    it('deduplicates 100 concurrent requests into one probe', async () => {
      let deliver: SuccessCb | undefined;
      getSize.mockImplementation((_uri, onSuccess) => {
        deliver = onSuccess as SuccessCb;
      });

      const requests = Array.from({ length: 100 }, () =>
        ImageSizeService.resolve({ uri: 'https://a.com/shared.jpg' })
      );
      deliver?.(100, 50);
      const results = await Promise.all(requests);

      expect(getSize).toHaveBeenCalledTimes(1);
      for (const result of results) {
        expect(result.aspectRatio).toBe(2);
      }
    });

    it('serves subsequent resolutions synchronously from cache', async () => {
      getSize.mockImplementation((_uri, onSuccess) => {
        (onSuccess as SuccessCb)(300, 100);
      });

      await ImageSizeService.resolve({ uri: 'https://a.com/1.jpg' });
      const cached = ImageSizeService.resolveFromCache({
        uri: 'https://a.com/1.jpg',
      });
      expect(cached).toEqual({
        width: 300,
        height: 100,
        aspectRatio: 3,
        fromCache: true,
      });

      const resolved = await ImageSizeService.resolve({
        uri: 'https://a.com/1.jpg',
      });
      expect(resolved.fromCache).toBe(true);
      expect(getSize).toHaveBeenCalledTimes(1);
    });

    it('probes with headers via getSizeWithHeaders', async () => {
      getSizeWithHeaders.mockImplementation((_uri, _headers, onSuccess) => {
        (onSuccess as SuccessCb)(10, 10);
      });

      await ImageSizeService.resolve({
        uri: 'https://a.com/auth.jpg',
        headers: { Authorization: 'token' },
      });
      expect(getSizeWithHeaders).toHaveBeenCalledTimes(1);
      expect(getSize).not.toHaveBeenCalled();
    });

    it('retries failed probes according to options', async () => {
      getSize
        .mockImplementationOnce((_uri, _onSuccess, onFailure) => {
          (onFailure as FailureCb)(new Error('flaky'));
        })
        .mockImplementationOnce((_uri, onSuccess) => {
          (onSuccess as SuccessCb)(50, 50);
        });

      const result = await ImageSizeService.resolve(
        { uri: 'https://a.com/flaky.jpg' },
        { retryCount: 1, retryDelay: 0 }
      );
      expect(result.aspectRatio).toBe(1);
      expect(getSize).toHaveBeenCalledTimes(2);
    });

    it('rejects after exhausting retries and allows later retry', async () => {
      getSize.mockImplementation((_uri, _onSuccess, onFailure) => {
        (onFailure as FailureCb)(new Error('down'));
      });

      await expect(
        ImageSizeService.resolve(
          { uri: 'https://a.com/down.jpg' },
          { retryCount: 2, retryDelay: 0 }
        )
      ).rejects.toThrow('down');
      expect(getSize).toHaveBeenCalledTimes(3);

      // A failure never poisons the cache: a later call probes again.
      getSize.mockImplementation((_uri, onSuccess) => {
        (onSuccess as SuccessCb)(20, 10);
      });
      const recovered = await ImageSizeService.resolve({
        uri: 'https://a.com/down.jpg',
      });
      expect(recovered.aspectRatio).toBe(2);
    });

    it('rejects sources without a uri', async () => {
      await expect(ImageSizeService.resolve({})).rejects.toThrow(
        'no uri'
      );
    });
  });

  describe('local assets', () => {
    it('resolves synchronously without probing the network', async () => {
      resolveAssetSource.mockReturnValue({
        uri: 'asset',
        width: 64,
        height: 32,
        scale: 1,
      });

      const sync = ImageSizeService.resolveFromCache(7);
      expect(sync).toEqual({
        width: 64,
        height: 32,
        aspectRatio: 2,
        fromCache: true,
      });

      const resolved = await ImageSizeService.resolve(7);
      expect(resolved.aspectRatio).toBe(2);
      expect(getSize).not.toHaveBeenCalled();
      expect(getSizeWithHeaders).not.toHaveBeenCalled();
    });

    it('rejects unresolvable assets', async () => {
      resolveAssetSource.mockReturnValue(
        undefined as unknown as ReturnType<typeof Image.resolveAssetSource>
      );
      await expect(ImageSizeService.resolve(999)).rejects.toThrow(
        'unresolvable local asset'
      );
    });
  });

  describe('reportLoadedDimensions', () => {
    const setPlatformOS = (os: typeof Platform.OS) => {
      Object.defineProperty(Platform, 'OS', {
        configurable: true,
        get: () => os,
      });
    };

    afterEach(() => {
      setPlatformOS('ios');
    });

    it('populates the cache from onLoad payloads on iOS', () => {
      setPlatformOS('ios');

      const reported = ImageSizeService.reportLoadedDimensions(
        { uri: 'https://a.com/loaded.jpg' },
        { width: 800, height: 400 }
      );
      expect(reported).toEqual({
        width: 800,
        height: 400,
        aspectRatio: 2,
        fromCache: false,
      });

      expect(
        ImageSizeService.resolveFromCache({ uri: 'https://a.com/loaded.jpg' })
      ).toEqual({ width: 800, height: 400, aspectRatio: 2, fromCache: true });
    });

    it('ignores FastImage onLoad dimensions on Android (avoids cache poison)', () => {
      setPlatformOS('android');

      const reported = ImageSizeService.reportLoadedDimensions(
        { uri: 'https://a.com/android.jpg' },
        // Typical bad Android payload: view/layout size, not intrinsic size.
        { width: 1080, height: 400 }
      );
      expect(reported).toBeNull();
      expect(
        ImageSizeService.resolveFromCache({ uri: 'https://a.com/android.jpg' })
      ).toBeNull();
    });

    it('ignores unidentifiable sources and invalid dimensions', () => {
      setPlatformOS('ios');

      expect(
        ImageSizeService.reportLoadedDimensions({}, { width: 1, height: 1 })
      ).toBeNull();
      expect(
        ImageSizeService.reportLoadedDimensions(
          { uri: 'https://a.com/x.jpg' },
          { width: 0, height: 0 }
        )
      ).toBeNull();
    });
  });
});
