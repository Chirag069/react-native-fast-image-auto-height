import { Image, StyleSheet, Text } from 'react-native';
import type { ImageStyle } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import FastImage, { FastImageConfigProvider } from '../index';
import { nativeFastImageStatics } from '../components/InternalFastImage';

type SuccessCb = (width: number, height: number) => void;

const flatten = (style: unknown): ImageStyle =>
  StyleSheet.flatten(style as ImageStyle) ?? {};

describe('FastImage', () => {
  const getSize = jest.spyOn(Image, 'getSize');

  beforeEach(() => {
    FastImage.clearSizeCache();
  });

  afterEach(() => {
    getSize.mockReset();
    jest.clearAllMocks();
  });

  describe('FastImage compatibility (classic mode)', () => {
    it('renders a single native image with pass-through props', async () => {
      const { getByTestId } = await render(
        <FastImage
          testID="img"
          source={{ uri: 'https://a.com/1.jpg', priority: FastImage.priority.high }}
          resizeMode={FastImage.resizeMode.contain}
          style={{ width: 100, height: 100 }}
        />
      );
      const image = getByTestId('img');
      expect(image.props.source).toEqual({ uri: 'https://a.com/1.jpg' });
      expect(image.props.resizeMode).toBe('contain');
      expect(flatten(image.props.style)).toMatchObject({
        width: 100,
        height: 100,
      });
      // Classic mode never probes for sizes.
      expect(getSize).not.toHaveBeenCalled();
    });

    it('exposes the classic enums and statics', () => {
      expect(FastImage.resizeMode.cover).toBe('cover');
      expect(FastImage.priority.normal).toBe('normal');
      expect(FastImage.cacheControl.immutable).toBe('immutable');
      expect(FastImage.transition.fade).toBe('fade');

      const sources = [{ uri: 'https://a.com/1.jpg' }];
      FastImage.preload(sources);
      expect(nativeFastImageStatics.preload).toHaveBeenCalledWith(sources);
    });

    it('forwards load lifecycle callbacks', async () => {
      const onLoadStart = jest.fn();
      const onLoad = jest.fn();
      const onLoadEnd = jest.fn();
      const { getByTestId } = await render(
        <FastImage
          testID="img"
          source={{ uri: 'https://a.com/1.jpg' }}
          onLoadStart={onLoadStart}
          onLoad={onLoad}
          onLoadEnd={onLoadEnd}
        />
      );

      await fireEvent(getByTestId('img'), 'loadStart');
      await fireEvent(getByTestId('img'), 'load', {
        nativeEvent: { width: 100, height: 50 },
      });

      expect(onLoadStart).toHaveBeenCalledTimes(1);
      expect(onLoad).toHaveBeenCalledWith({
        nativeEvent: { width: 100, height: 50 },
      });
      expect(onLoadEnd).toHaveBeenCalledTimes(1);
    });

    it('renders children over the image', async () => {
      const { getByText } = await render(
        <FastImage source={{ uri: 'https://a.com/1.jpg' }}>
          <Text>overlay</Text>
        </FastImage>
      );
      expect(getByText('overlay')).toBeTruthy();
    });
  });

  describe('autoHeight', () => {
    it('computes height from a numeric style width once resolved', async () => {
      getSize.mockImplementation((_uri, onSuccess) => {
        setTimeout(() => (onSuccess as SuccessCb)(400, 200), 0);
      });

      const { getByTestId } = await render(
        <FastImage
          testID="img"
          source={{ uri: 'https://a.com/auto.jpg' }}
          style={{ width: 200 }}
          autoHeight
        />
      );

      await waitFor(() =>
        expect(flatten(getByTestId('img').props.style).height).toBe(100)
      );
    });

    it('uses estimatedAspectRatio before resolution completes', async () => {
      getSize.mockImplementation(() => {
        // Probe intentionally never answers.
      });

      const { getByTestId } = await render(
        <FastImage
          testID="img"
          source={{ uri: 'https://a.com/est.jpg' }}
          style={{ width: 300 }}
          autoHeight
          estimatedAspectRatio={3}
        />
      );
      expect(flatten(getByTestId('img').props.style).height).toBe(100);
    });

    it('settles height from onLoad when it beats the probe', async () => {
      getSize.mockImplementation(() => {
        // Probe never answers — the image load wins.
      });

      const { getByTestId } = await render(
        <FastImage
          testID="img"
          source={{ uri: 'https://a.com/onload.jpg' }}
          style={{ width: 200 }}
          autoHeight
        />
      );

      await fireEvent(getByTestId('img'), 'load', {
        nativeEvent: { width: 100, height: 100 },
      });
      await waitFor(() =>
        expect(flatten(getByTestId('img').props.style).height).toBe(200)
      );
    });

    it('measures flex/percentage widths via onLayout', async () => {
      getSize.mockImplementation((_uri, onSuccess) => {
        (onSuccess as SuccessCb)(200, 100);
      });

      const { getByTestId } = await render(
        <FastImage
          testID="img"
          source={{ uri: 'https://a.com/flex.jpg' }}
          style={{ width: '100%' }}
          autoHeight
        />
      );

      await fireEvent(getByTestId('img'), 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width: 350, height: 0 } },
      });
      await waitFor(() =>
        expect(flatten(getByTestId('img').props.style).height).toBe(175)
      );
    });

    it('never overrides an explicit style height', async () => {
      // The dev warning about the ignored autoHeight is expected here.
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      getSize.mockImplementation((_uri, onSuccess) => {
        (onSuccess as SuccessCb)(400, 200);
      });

      const { getByTestId } = await render(
        <FastImage
          testID="img"
          source={{ uri: 'https://a.com/fixed.jpg' }}
          style={{ width: 200, height: 77 }}
          autoHeight
        />
      );
      expect(flatten(getByTestId('img').props.style).height).toBe(77);
      expect(getSize).not.toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('throws in dev when combined with autoWidth', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      await expect(
        render(
          <FastImage
            source={{ uri: 'https://a.com/x.jpg' }}
            autoHeight
            autoWidth
          />
        )
      ).rejects.toThrow('mutually exclusive');
      errorSpy.mockRestore();
    });
  });

  describe('autoWidth', () => {
    it('computes width from a numeric style height once resolved', async () => {
      getSize.mockImplementation((_uri, onSuccess) => {
        setTimeout(() => (onSuccess as SuccessCb)(400, 200), 0);
      });

      const { getByTestId } = await render(
        <FastImage
          testID="img"
          source={{ uri: 'https://a.com/auto-w.jpg' }}
          style={{ height: 100 }}
          autoWidth
        />
      );

      await waitFor(() =>
        expect(flatten(getByTestId('img').props.style).width).toBe(200)
      );
    });
  });

  describe('onSizeResolved', () => {
    it('reports the resolved size exactly once', async () => {
      getSize.mockImplementation((_uri, onSuccess) => {
        setTimeout(() => (onSuccess as SuccessCb)(300, 100), 0);
      });
      const onSizeResolved = jest.fn();

      await render(
        <FastImage
          source={{ uri: 'https://a.com/report.jpg' }}
          onSizeResolved={onSizeResolved}
        />
      );

      await waitFor(() => expect(onSizeResolved).toHaveBeenCalledTimes(1));
      expect(onSizeResolved).toHaveBeenCalledWith({
        width: 300,
        height: 100,
        aspectRatio: 3,
        fromCache: false,
      });
    });
  });

  describe('placeholder and transition', () => {
    it('shows the placeholder until the image loads', async () => {
      const { getByTestId, getByText, queryByText } = await render(
        <FastImage
          testID="img"
          source={{ uri: 'https://a.com/ph.jpg' }}
          style={{ width: 100, height: 100 }}
          placeholder={<Text>loading...</Text>}
        />
      );
      expect(getByText('loading...')).toBeTruthy();

      await fireEvent(getByTestId('img'), 'load', {
        nativeEvent: { width: 10, height: 10 },
      });
      await waitFor(() => expect(queryByText('loading...')).toBeNull());
    });

    it('renders an image-source placeholder through the native engine', async () => {
      const { getByTestId } = await render(
        <FastImage
          testID="img"
          source={{ uri: 'https://a.com/full.jpg' }}
          style={{ width: 100, height: 100 }}
          placeholder={{ uri: 'https://a.com/thumb.jpg' }}
        />
      );
      expect(getByTestId('img-placeholder').props.source).toEqual({
        uri: 'https://a.com/thumb.jpg',
      });
    });

    it('wraps the image in a fade container when transitionDuration is set', async () => {
      const { getByTestId } = await render(
        <FastImage
          testID="img"
          source={{ uri: 'https://a.com/fade.jpg' }}
          style={{ width: 100, height: 100 }}
          transitionDuration={150}
        />
      );
      // The image is still reachable and receives its source.
      expect(getByTestId('img').props.source).toEqual({
        uri: 'https://a.com/fade.jpg',
      });
    });
  });

  describe('retries', () => {
    it('remounts the native image per retry and reports one final error', async () => {
      jest.useFakeTimers();
      try {
        const onError = jest.fn();
        const { getByTestId } = await render(
          <FastImage
            testID="img"
            source={{ uri: 'https://a.com/retry.jpg' }}
            retryCount={1}
            retryDelay={100}
            onError={onError}
          />
        );

        await fireEvent(getByTestId('img'), 'error');
        expect(onError).not.toHaveBeenCalled();

        await act(async () => {
          jest.advanceTimersByTime(100);
        });

        await fireEvent(getByTestId('img'), 'error');
        expect(onError).toHaveBeenCalledTimes(1);
      } finally {
        jest.useRealTimers();
      }
    });
  });

  describe('lazy', () => {
    it('withholds the source until idle, then loads', async () => {
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
        const { getByTestId } = await render(
          <FastImage
            testID="img"
            source={{ uri: 'https://a.com/lazy.jpg' }}
            lazy
          />
        );
        expect(getByTestId('img').props.source).toEqual({ uri: undefined });

        await act(async () => runIdle?.());
        expect(getByTestId('img').props.source).toEqual({
          uri: 'https://a.com/lazy.jpg',
        });
      } finally {
        delete idleGlobal.requestIdleCallback;
        delete idleGlobal.cancelIdleCallback;
      }
    });
  });

  describe('FastImageConfigProvider', () => {
    it('applies global defaults, overridable per component', async () => {
      getSize.mockImplementation(() => {
        // Never resolves: estimated ratios drive the layout.
      });

      const { getByTestId } = await render(
        <FastImageConfigProvider config={{ estimatedAspectRatio: 2 }}>
          <FastImage
            testID="global"
            source={{ uri: 'https://a.com/g.jpg' }}
            style={{ width: 200 }}
            autoHeight
          />
          <FastImage
            testID="local"
            source={{ uri: 'https://a.com/l.jpg' }}
            style={{ width: 200 }}
            autoHeight
            estimatedAspectRatio={4}
          />
        </FastImageConfigProvider>
      );

      expect(flatten(getByTestId('global').props.style).height).toBe(100);
      expect(flatten(getByTestId('local').props.style).height).toBe(50);
    });
  });
});
