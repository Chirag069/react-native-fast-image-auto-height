import { Image, Platform } from 'react-native';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useImageDimensions } from '../useImageDimensions';
import { ImageSizeService } from '../../services/ImageSizeService';
import type { FastImageSource } from '../../types/source';

type SuccessCb = (width: number, height: number) => void;
type FailureCb = (error: unknown) => void;

describe('useImageDimensions', () => {
  const getSize = jest.spyOn(Image, 'getSize');

  beforeEach(() => {
    ImageSizeService.clearCache();
  });

  afterEach(() => {
    getSize.mockReset();
  });

  it('resolves remote dimensions asynchronously', async () => {
    getSize.mockImplementation((_uri, onSuccess) => {
      setTimeout(() => (onSuccess as SuccessCb)(400, 200), 0);
    });

    const { result } = await renderHook(() =>
      useImageDimensions({ uri: 'https://a.com/1.jpg' })
    );
    expect(result.current.status).toBe('resolving');
    expect(result.current.aspectRatio).toBeNull();

    await waitFor(() => expect(result.current.status).toBe('resolved'));
    expect(result.current.dimensions).toEqual({ width: 400, height: 200 });
    expect(result.current.aspectRatio).toBe(2);
    expect(result.current.fromCache).toBe(false);
  });

  it('resolves synchronously from cache on the first render', async () => {
    getSize.mockImplementation((_uri, onSuccess) => {
      (onSuccess as SuccessCb)(100, 50);
    });
    await ImageSizeService.resolve({ uri: 'https://a.com/cached.jpg' });
    getSize.mockClear();

    const { result } = await renderHook(() =>
      useImageDimensions({ uri: 'https://a.com/cached.jpg' })
    );
    expect(result.current.status).toBe('resolved');
    expect(result.current.aspectRatio).toBe(2);
    expect(result.current.fromCache).toBe(true);
    expect(getSize).not.toHaveBeenCalled();
  });

  it('fires onSizeResolved exactly once', async () => {
    getSize.mockImplementation((_uri, onSuccess) => {
      setTimeout(() => (onSuccess as SuccessCb)(300, 100), 0);
    });
    const onSizeResolved = jest.fn();

    const { result, rerender } = await renderHook(
      (_props: undefined) =>
        useImageDimensions(
          { uri: 'https://a.com/once.jpg' },
          { onSizeResolved }
        ),
      { initialProps: undefined }
    );
    await waitFor(() => expect(result.current.status).toBe('resolved'));
    await rerender(undefined);
    await rerender(undefined);

    expect(onSizeResolved).toHaveBeenCalledTimes(1);
    expect(onSizeResolved).toHaveBeenCalledWith({
      width: 300,
      height: 100,
      aspectRatio: 3,
      fromCache: false,
    });
  });

  it('reports failure after the probe rejects', async () => {
    getSize.mockImplementation((_uri, _onSuccess, onFailure) => {
      setTimeout(() => (onFailure as FailureCb)(new Error('down')), 0);
    });

    const { result } = await renderHook(() =>
      useImageDimensions({ uri: 'https://a.com/down.jpg' })
    );
    await waitFor(() => expect(result.current.status).toBe('failed'));
    expect(result.current.dimensions).toBeNull();
  });

  it('resets state when the source changes (recycled cells)', async () => {
    getSize.mockImplementation((uri, onSuccess) => {
      setTimeout(
        () => (onSuccess as SuccessCb)(uri.endsWith('a.jpg') ? 100 : 300, 100),
        0
      );
    });

    const { result, rerender } = await renderHook(
      ({ source }: { source: FastImageSource }) => useImageDimensions(source),
      { initialProps: { source: { uri: 'https://a.com/a.jpg' } } }
    );
    await waitFor(() => expect(result.current.aspectRatio).toBe(1));

    await rerender({ source: { uri: 'https://a.com/b.jpg' } });
    // Old dimensions must never leak into the new source.
    expect(result.current.aspectRatio === 1).toBe(false);

    await waitFor(() => expect(result.current.aspectRatio).toBe(3));
  });

  it('never applies a stale result after the source changes', async () => {
    const callbacks = new Map<string, SuccessCb>();
    getSize.mockImplementation((uri, onSuccess) => {
      callbacks.set(uri, onSuccess as SuccessCb);
    });

    const { result, rerender } = await renderHook(
      ({ source }: { source: FastImageSource }) => useImageDimensions(source),
      { initialProps: { source: { uri: 'https://a.com/slow.jpg' } } }
    );
    await rerender({ source: { uri: 'https://a.com/fast.jpg' } });

    // The old probe finishes AFTER the source changed.
    await act(() => callbacks.get('https://a.com/slow.jpg')?.(999, 1));
    expect(result.current.aspectRatio).toBeNull();

    await act(() => callbacks.get('https://a.com/fast.jpg')?.(200, 100));
    await waitFor(() => expect(result.current.aspectRatio).toBe(2));
  });

  it('does not update state after unmount', async () => {
    let deliver: SuccessCb | undefined;
    getSize.mockImplementation((_uri, onSuccess) => {
      deliver = onSuccess as SuccessCb;
    });
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { unmount } = await renderHook(() =>
      useImageDimensions({ uri: 'https://a.com/unmounted.jpg' })
    );
    await unmount();
    await act(() => deliver?.(10, 10));

    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('settles from reported onLoad dimensions when they beat the probe on iOS', async () => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      get: () => 'ios',
    });
    getSize.mockImplementation(() => {
      // Probe never answers — the image itself loads first.
    });

    const { result } = await renderHook(() =>
      useImageDimensions({ uri: 'https://a.com/onload.jpg' })
    );
    expect(result.current.status).toBe('resolving');

    await act(() =>
      result.current.reportDimensions({ width: 500, height: 250 })
    );
    expect(result.current.status).toBe('resolved');
    expect(result.current.aspectRatio).toBe(2);
  });

  it('does not settle from Android onLoad reports (layout-size poison)', async () => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      get: () => 'android',
    });
    getSize.mockImplementation(() => {
      // Probe never answers in this assertion window.
    });

    const { result } = await renderHook(() =>
      useImageDimensions({ uri: 'https://a.com/android-onload.jpg' })
    );

    await act(() =>
      result.current.reportDimensions({ width: 1080, height: 400 })
    );
    expect(result.current.status).toBe('resolving');
    expect(result.current.aspectRatio).toBeNull();
  });

  it('resolves local assets synchronously', async () => {
    const resolveAssetSource = jest
      .spyOn(Image, 'resolveAssetSource')
      .mockReturnValue({ uri: 'asset', width: 40, height: 20, scale: 1 });

    const { result } = await renderHook(() => useImageDimensions(7));
    expect(result.current.status).toBe('resolved');
    expect(result.current.aspectRatio).toBe(2);
    expect(result.current.fromCache).toBe(true);

    resolveAssetSource.mockRestore();
  });

  it('stays idle without a source', async () => {
    const { result } = await renderHook(() => useImageDimensions(undefined));
    expect(result.current.status).toBe('idle');
  });

  it('stays idle when disabled', async () => {
    const { result } = await renderHook(() =>
      useImageDimensions({ uri: 'https://a.com/1.jpg' }, { enabled: false })
    );
    expect(result.current.status).toBe('idle');
    expect(getSize).not.toHaveBeenCalled();
  });
});
