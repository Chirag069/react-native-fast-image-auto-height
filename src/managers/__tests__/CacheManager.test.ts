import { CacheManager } from '../CacheManager';
import type { SizeCacheStorage } from '../../types/cache';

describe('CacheManager', () => {
  it('stores and retrieves sizes synchronously', () => {
    const manager = new CacheManager();
    manager.setSize('key', { width: 200, height: 100 });
    expect(manager.getSize('key')).toEqual({
      width: 200,
      height: 100,
      aspectRatio: 2,
    });
  });

  it('rejects invalid dimensions', () => {
    const manager = new CacheManager();
    expect(manager.setSize('key', { width: 0, height: 100 })).toBeUndefined();
    expect(manager.getSize('key')).toBeUndefined();
  });

  it('deduplicates concurrent async work per key', async () => {
    const manager = new CacheManager();
    const factory = jest.fn().mockResolvedValue({ width: 1, height: 1 });

    const [a, b] = await Promise.all([
      manager.dedupe('k', factory),
      manager.dedupe('k', factory),
    ]);
    expect(factory).toHaveBeenCalledTimes(1);
    expect(a).toEqual(b);
  });

  it('reports in-flight probes via isPending', async () => {
    const manager = new CacheManager();
    let release: (() => void) | undefined;
    const request = manager.dedupe(
      'k',
      () =>
        new Promise((resolve) => {
          release = () => resolve({ width: 1, height: 1 });
        })
    );
    expect(manager.isPending('k')).toBe(true);
    release?.();
    await request;
    expect(manager.isPending('k')).toBe(false);
  });

  it('write-throughs the aspect ratio to installed storage', () => {
    const manager = new CacheManager();
    const storage: SizeCacheStorage = {
      get: jest.fn(),
      set: jest.fn(),
      clear: jest.fn(),
    };
    manager.setStorage(storage);
    manager.setSize('key', { width: 300, height: 200 });
    expect(storage.set).toHaveBeenCalledWith('key', 1.5);
  });

  it('survives storage backends that throw', () => {
    const manager = new CacheManager();
    manager.setStorage({
      get: () => undefined,
      set: () => {
        throw new Error('disk full');
      },
      clear: () => undefined,
    });
    expect(() =>
      manager.setSize('key', { width: 1, height: 1 })
    ).not.toThrow();
    // Memory cache still updated despite the storage failure.
    expect(manager.getSize('key')).toBeDefined();
  });

  it('clear() empties memory and the installed storage', () => {
    const manager = new CacheManager();
    const storage: SizeCacheStorage = {
      get: jest.fn(),
      set: jest.fn(),
      clear: jest.fn(),
    };
    manager.setStorage(storage);
    manager.setSize('key', { width: 1, height: 1 });
    manager.clear();
    expect(manager.getSize('key')).toBeUndefined();
    expect(manager.sizeCacheEntryCount).toBe(0);
    expect(storage.clear).toHaveBeenCalledTimes(1);
  });
});
