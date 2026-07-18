import { createCacheKey } from '../createCacheKey';

describe('createCacheKey', () => {
  it('keys local assets on their asset id', () => {
    expect(createCacheKey(42)).toBe('asset:42');
  });

  it('keys plain remote sources on their uri', () => {
    expect(createCacheKey({ uri: 'https://a.com/1.jpg' })).toBe(
      'https://a.com/1.jpg'
    );
  });

  it('ignores priority and cache options in the key', () => {
    expect(
      createCacheKey({ uri: 'https://a.com/1.jpg', priority: 'high', cache: 'web' })
    ).toBe('https://a.com/1.jpg');
  });

  it('returns null when there is nothing to identify', () => {
    expect(createCacheKey({})).toBeNull();
    expect(createCacheKey({ uri: '' })).toBeNull();
  });

  it('differentiates the same uri with different headers', () => {
    const a = createCacheKey({
      uri: 'https://a.com/1.jpg',
      headers: { Authorization: 'token-a' },
    });
    const b = createCacheKey({
      uri: 'https://a.com/1.jpg',
      headers: { Authorization: 'token-b' },
    });
    expect(a).not.toBe(b);
    expect(a).not.toBe('https://a.com/1.jpg');
  });

  it('is order-independent over header keys', () => {
    const a = createCacheKey({
      uri: 'https://a.com/1.jpg',
      headers: { A: '1', B: '2' },
    });
    const b = createCacheKey({
      uri: 'https://a.com/1.jpg',
      headers: { B: '2', A: '1' },
    });
    expect(a).toBe(b);
  });

  it('treats empty headers like no headers', () => {
    expect(createCacheKey({ uri: 'https://a.com/1.jpg', headers: {} })).toBe(
      'https://a.com/1.jpg'
    );
  });
});
