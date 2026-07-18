import { renderHook } from '@testing-library/react-native';
import { useAutoHeight } from '../useAutoHeight';
import { useAutoWidth } from '../useAutoWidth';

describe('useAutoHeight', () => {
  it('derives height from width and intrinsic ratio', async () => {
    const { result } = await renderHook(() =>
      useAutoHeight({ enabled: true, width: 200, aspectRatio: 2 })
    );
    expect(result.current).toBe(100);
  });

  it('falls back to the estimated ratio while unresolved', async () => {
    const { result } = await renderHook(() =>
      useAutoHeight({
        enabled: true,
        width: 300,
        aspectRatio: null,
        estimatedAspectRatio: 1.5,
      })
    );
    expect(result.current).toBe(200);
  });

  it('prefers the intrinsic ratio over the estimate', async () => {
    const { result } = await renderHook(() =>
      useAutoHeight({
        enabled: true,
        width: 200,
        aspectRatio: 2,
        estimatedAspectRatio: 1,
      })
    );
    expect(result.current).toBe(100);
  });

  it('returns undefined when disabled', async () => {
    const { result } = await renderHook(() =>
      useAutoHeight({ enabled: false, width: 200, aspectRatio: 2 })
    );
    expect(result.current).toBeUndefined();
  });

  it('returns undefined without a width', async () => {
    const { result } = await renderHook(() =>
      useAutoHeight({ enabled: true, width: undefined, aspectRatio: 2 })
    );
    expect(result.current).toBeUndefined();
  });

  it('returns undefined without any ratio', async () => {
    const { result } = await renderHook(() =>
      useAutoHeight({ enabled: true, width: 200, aspectRatio: null })
    );
    expect(result.current).toBeUndefined();
  });
});

describe('useAutoWidth', () => {
  it('derives width from height and intrinsic ratio', async () => {
    const { result } = await renderHook(() =>
      useAutoWidth({ enabled: true, height: 100, aspectRatio: 2 })
    );
    expect(result.current).toBe(200);
  });

  it('falls back to the estimated ratio while unresolved', async () => {
    const { result } = await renderHook(() =>
      useAutoWidth({
        enabled: true,
        height: 100,
        aspectRatio: undefined,
        estimatedAspectRatio: 0.5,
      })
    );
    expect(result.current).toBe(50);
  });

  it('returns undefined when disabled', async () => {
    const { result } = await renderHook(() =>
      useAutoWidth({ enabled: false, height: 100, aspectRatio: 2 })
    );
    expect(result.current).toBeUndefined();
  });
});
