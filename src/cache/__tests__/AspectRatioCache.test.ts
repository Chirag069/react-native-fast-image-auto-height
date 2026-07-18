import { AspectRatioCache } from '../AspectRatioCache';

describe('AspectRatioCache', () => {
  it('stores dimensions and their derived aspect ratio per key', () => {
    const cache = new AspectRatioCache();
    cache.set('https://a.com/1.jpg', { width: 300, height: 200 });
    expect(cache.get('https://a.com/1.jpg')).toEqual({
      width: 300,
      height: 200,
      aspectRatio: 1.5,
    });
    expect(cache.get('https://a.com/2.jpg')).toBeUndefined();
  });

  it('returns the stored entry from set', () => {
    const cache = new AspectRatioCache();
    expect(cache.set('a', { width: 100, height: 50 })).toEqual({
      width: 100,
      height: 50,
      aspectRatio: 2,
    });
  });

  it('silently rejects invalid dimensions', () => {
    const cache = new AspectRatioCache();
    expect(cache.set('a', { width: 0, height: 10 })).toBeUndefined();
    expect(cache.set('b', { width: 10, height: -2 })).toBeUndefined();
    expect(cache.set('c', { width: NaN, height: 10 })).toBeUndefined();
    expect(cache.set('d', { width: 10, height: Infinity })).toBeUndefined();
    expect(cache.size).toBe(0);
  });

  it('respects a custom capacity with LRU eviction', () => {
    const cache = new AspectRatioCache(2);
    cache.set('a', { width: 1, height: 1 });
    cache.set('b', { width: 2, height: 1 });
    cache.set('c', { width: 3, height: 1 });
    expect(cache.get('a')).toBeUndefined();
    expect(cache.size).toBe(2);
  });

  it('clears all entries', () => {
    const cache = new AspectRatioCache();
    cache.set('a', { width: 1, height: 1 });
    cache.clear();
    expect(cache.size).toBe(0);
  });
});
