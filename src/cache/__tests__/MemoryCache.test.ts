import { MemoryCache } from '../MemoryCache';

describe('MemoryCache', () => {
  it('stores and retrieves values', () => {
    const cache = new MemoryCache<string, number>(3);
    cache.set('a', 1);
    expect(cache.get('a')).toBe(1);
    expect(cache.get('missing')).toBeUndefined();
    expect(cache.size).toBe(1);
  });

  it('evicts the least-recently-used entry beyond capacity', () => {
    const cache = new MemoryCache<string, number>(2);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3); // evicts "a"
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBe(2);
    expect(cache.get('c')).toBe(3);
    expect(cache.size).toBe(2);
  });

  it('refreshes recency on get', () => {
    const cache = new MemoryCache<string, number>(2);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.get('a'); // "a" is now most recent
    cache.set('c', 3); // evicts "b", not "a"
    expect(cache.get('a')).toBe(1);
    expect(cache.get('b')).toBeUndefined();
  });

  it('overwrites existing keys without evicting others', () => {
    const cache = new MemoryCache<string, number>(2);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('a', 10);
    expect(cache.get('a')).toBe(10);
    expect(cache.get('b')).toBe(2);
    expect(cache.size).toBe(2);
  });

  it('supports delete and clear', () => {
    const cache = new MemoryCache<string, number>(2);
    cache.set('a', 1);
    expect(cache.delete('a')).toBe(true);
    expect(cache.delete('a')).toBe(false);
    cache.set('b', 2);
    cache.clear();
    expect(cache.size).toBe(0);
  });

  it('rejects invalid capacities', () => {
    expect(() => new MemoryCache(0)).toThrow('positive integer');
    expect(() => new MemoryCache(-1)).toThrow('positive integer');
    expect(() => new MemoryCache(1.5)).toThrow('positive integer');
  });
});
