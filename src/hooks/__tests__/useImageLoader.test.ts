import { act, renderHook, waitFor } from '@testing-library/react-native';
import { useImageLoader } from '../useImageLoader';
import type { UseImageLoaderOptions } from '../useImageLoader';

const baseOptions = (
  overrides: Partial<UseImageLoaderOptions> = {}
): UseImageLoaderOptions => ({
  sourceKey: 'https://a.com/1.jpg',
  retryCount: 0,
  retryDelay: 0,
  lazy: false,
  ...overrides,
});

const loadEvent = { nativeEvent: { width: 100, height: 50 } };

describe('useImageLoader', () => {
  it('loads immediately when not lazy', async () => {
    const { result } = await renderHook(() => useImageLoader(baseOptions()));
    expect(result.current.shouldLoad).toBe(true);
    expect(result.current.attempt).toBe(0);
    expect(result.current.loaded).toBe(false);
    expect(result.current.failed).toBe(false);
  });

  it('reports success through the wrapped handlers', async () => {
    const onLoadStart = jest.fn();
    const onLoad = jest.fn();
    const onLoadEnd = jest.fn();
    const { result } = await renderHook(() =>
      useImageLoader(baseOptions({ onLoadStart, onLoad, onLoadEnd }))
    );

    await act(() => {
      result.current.handlers.onLoadStart();
      result.current.handlers.onLoad(loadEvent);
    });

    expect(result.current.loaded).toBe(true);
    expect(onLoadStart).toHaveBeenCalledTimes(1);
    expect(onLoad).toHaveBeenCalledWith(loadEvent);
    expect(onLoadEnd).toHaveBeenCalledTimes(1);
  });

  it('fails immediately with retryCount 0 (classic FastImage behavior)', async () => {
    const onError = jest.fn();
    const onLoadEnd = jest.fn();
    const { result } = await renderHook(() =>
      useImageLoader(baseOptions({ onError, onLoadEnd }))
    );

    await act(() => result.current.handlers.onError());

    expect(result.current.failed).toBe(true);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onLoadEnd).toHaveBeenCalledTimes(1);
  });

  it('retries with delay and suppresses intermediate errors', async () => {
    jest.useFakeTimers();
    try {
      const onError = jest.fn();
      const onLoadEnd = jest.fn();
      const { result } = await renderHook(() =>
        useImageLoader(
          baseOptions({ retryCount: 2, retryDelay: 300, onError, onLoadEnd })
        )
      );

      // Attempt 0 fails: no user-visible error yet, retry scheduled.
      await act(() => result.current.handlers.onError());
      expect(onError).not.toHaveBeenCalled();
      expect(result.current.attempt).toBe(0);

      await act(() => jest.advanceTimersByTime(300));
      expect(result.current.attempt).toBe(1);

      // Attempt 1 fails, retry again.
      await act(() => result.current.handlers.onError());
      await act(() => jest.advanceTimersByTime(300));
      expect(result.current.attempt).toBe(2);

      // Final attempt fails: user callbacks fire once.
      await act(() => result.current.handlers.onError());
      expect(result.current.failed).toBe(true);
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onLoadEnd).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });

  it('fires onLoadStart only for the first attempt', async () => {
    jest.useFakeTimers();
    try {
      const onLoadStart = jest.fn();
      const { result } = await renderHook(() =>
        useImageLoader(
          baseOptions({ retryCount: 1, retryDelay: 100, onLoadStart })
        )
      );

      await act(() => result.current.handlers.onLoadStart());
      await act(() => result.current.handlers.onError());
      await act(() => jest.advanceTimersByTime(100));
      await act(() => result.current.handlers.onLoadStart());

      expect(onLoadStart).toHaveBeenCalledTimes(1);
    } finally {
      jest.useRealTimers();
    }
  });

  it('resets the lifecycle when the source changes', async () => {
    const { result, rerender } = await renderHook(
      (props: UseImageLoaderOptions) => useImageLoader(props),
      { initialProps: baseOptions() }
    );

    await act(() => result.current.handlers.onError());
    expect(result.current.failed).toBe(true);

    await rerender(baseOptions({ sourceKey: 'https://a.com/2.jpg' }));
    expect(result.current.failed).toBe(false);
    expect(result.current.attempt).toBe(0);
  });

  it('cancels a pending retry when the source changes', async () => {
    jest.useFakeTimers();
    try {
      const { result, rerender } = await renderHook(
        (props: UseImageLoaderOptions) => useImageLoader(props),
        { initialProps: baseOptions({ retryCount: 1, retryDelay: 100 }) }
      );

      await act(() => result.current.handlers.onError());
      await rerender(
        baseOptions({
          sourceKey: 'https://a.com/2.jpg',
          retryCount: 1,
          retryDelay: 100,
        })
      );
      await act(() => jest.advanceTimersByTime(100));

      // The stale retry must not bump the new source's attempt.
      expect(result.current.attempt).toBe(0);
    } finally {
      jest.useRealTimers();
    }
  });

  it('defers loading until the JS thread is idle when lazy', async () => {
    let runIdle: (() => void) | undefined;
    const idleGlobal = globalThis as {
      requestIdleCallback?: (cb: () => void) => number;
      cancelIdleCallback?: (handle: number) => void;
    };
    idleGlobal.requestIdleCallback = (cb) => {
      runIdle = cb;
      return 1;
    };
    idleGlobal.cancelIdleCallback = jest.fn();

    try {
      const { result } = await renderHook(() =>
        useImageLoader(baseOptions({ lazy: true }))
      );
      expect(result.current.shouldLoad).toBe(false);

      await act(() => runIdle?.());
      await waitFor(() => expect(result.current.shouldLoad).toBe(true));
    } finally {
      delete idleGlobal.requestIdleCallback;
      delete idleGlobal.cancelIdleCallback;
    }
  });

  it('cancels the pending idle task on unmount', async () => {
    const cancelIdleCallback = jest.fn();
    const idleGlobal = globalThis as {
      requestIdleCallback?: (cb: () => void) => number;
      cancelIdleCallback?: (handle: number) => void;
    };
    idleGlobal.requestIdleCallback = () => 42;
    idleGlobal.cancelIdleCallback = cancelIdleCallback;

    try {
      const { unmount } = await renderHook(() =>
        useImageLoader(baseOptions({ lazy: true }))
      );
      await unmount();
      expect(cancelIdleCallback).toHaveBeenCalledWith(42);
    } finally {
      delete idleGlobal.requestIdleCallback;
      delete idleGlobal.cancelIdleCallback;
    }
  });

  it('falls back to a macrotask when requestIdleCallback is unavailable', async () => {
    const { result } = await renderHook(() =>
      useImageLoader(baseOptions({ lazy: true }))
    );
    expect(result.current.shouldLoad).toBe(false);
    await waitFor(() => expect(result.current.shouldLoad).toBe(true));
  });
});
