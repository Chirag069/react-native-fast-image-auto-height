import { PendingRequestCache } from '../PendingRequestCache';

describe('PendingRequestCache', () => {
  it('runs the factory once for concurrent requests with the same key', async () => {
    const cache = new PendingRequestCache<number>();
    const factory = jest.fn(
      () => new Promise<number>((resolve) => setTimeout(() => resolve(7), 0))
    );

    const requests = Array.from({ length: 100 }, () =>
      cache.getOrCreate('same-key', factory)
    );
    const results = await Promise.all(requests);

    expect(factory).toHaveBeenCalledTimes(1);
    expect(results).toEqual(Array.from({ length: 100 }, () => 7));
  });

  it('shares the exact same promise instance', () => {
    const cache = new PendingRequestCache<number>();
    const factory = () => Promise.resolve(1);
    const a = cache.getOrCreate('k', factory);
    const b = cache.getOrCreate('k', factory);
    expect(a).toBe(b);
  });

  it('runs factories independently for different keys', async () => {
    const cache = new PendingRequestCache<string>();
    const a = cache.getOrCreate('a', () => Promise.resolve('a'));
    const b = cache.getOrCreate('b', () => Promise.resolve('b'));
    await expect(a).resolves.toBe('a');
    await expect(b).resolves.toBe('b');
  });

  it('evicts settled promises so later calls re-run the factory', async () => {
    const cache = new PendingRequestCache<number>();
    const factory = jest.fn().mockResolvedValue(1);
    await cache.getOrCreate('k', factory);
    expect(cache.has('k')).toBe(false);
    await cache.getOrCreate('k', factory);
    expect(factory).toHaveBeenCalledTimes(2);
  });

  it('evicts rejected promises so failures are retryable', async () => {
    const cache = new PendingRequestCache<number>();
    const factory = jest
      .fn<Promise<number>, []>()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce(2);

    await expect(cache.getOrCreate('k', factory)).rejects.toThrow('fail');
    await expect(cache.getOrCreate('k', factory)).resolves.toBe(2);
    expect(factory).toHaveBeenCalledTimes(2);
  });

  it('every concurrent caller receives the same rejection', async () => {
    const cache = new PendingRequestCache<number>();
    const factory = jest.fn().mockRejectedValue(new Error('shared failure'));
    const a = cache.getOrCreate('k', factory);
    const b = cache.getOrCreate('k', factory);
    await expect(a).rejects.toThrow('shared failure');
    await expect(b).rejects.toThrow('shared failure');
    expect(factory).toHaveBeenCalledTimes(1);
  });
});
