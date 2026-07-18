import { RequestManager } from '../RequestManager';

describe('RequestManager', () => {
  const manager = new RequestManager();

  it('resolves on first success without retrying', async () => {
    const task = jest.fn().mockResolvedValue('ok');
    await expect(
      manager.execute(task, { retryCount: 3, retryDelay: 0 })
    ).resolves.toBe('ok');
    expect(task).toHaveBeenCalledTimes(1);
  });

  it('retries failed tasks up to retryCount times', async () => {
    const task = jest
      .fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValueOnce('recovered');

    await expect(
      manager.execute(task, { retryCount: 2, retryDelay: 0 })
    ).resolves.toBe('recovered');
    expect(task).toHaveBeenCalledTimes(3);
  });

  it('rejects with the final error when all attempts fail', async () => {
    const task = jest
      .fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('final failure'));

    await expect(
      manager.execute(task, { retryCount: 1, retryDelay: 0 })
    ).rejects.toThrow('final failure');
    expect(task).toHaveBeenCalledTimes(2);
  });

  it('does not retry when retryCount is 0 (classic FastImage behavior)', async () => {
    const task = jest.fn().mockRejectedValue(new Error('fail'));
    await expect(
      manager.execute(task, { retryCount: 0, retryDelay: 0 })
    ).rejects.toThrow('fail');
    expect(task).toHaveBeenCalledTimes(1);
  });

  it('waits retryDelay between attempts', async () => {
    jest.useFakeTimers();
    try {
      const task = jest
        .fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce('ok');

      const execution = manager.execute(task, {
        retryCount: 1,
        retryDelay: 500,
      });

      // Let the first (failing) attempt settle.
      await Promise.resolve();
      await Promise.resolve();
      expect(task).toHaveBeenCalledTimes(1);

      await jest.advanceTimersByTimeAsync(499);
      expect(task).toHaveBeenCalledTimes(1);

      await jest.advanceTimersByTimeAsync(1);
      await expect(execution).resolves.toBe('ok');
      expect(task).toHaveBeenCalledTimes(2);
    } finally {
      jest.useRealTimers();
    }
  });

  it('normalizes negative retry options', async () => {
    const task = jest.fn().mockRejectedValue(new Error('fail'));
    await expect(
      manager.execute(task, { retryCount: -5, retryDelay: -100 })
    ).rejects.toThrow('fail');
    expect(task).toHaveBeenCalledTimes(1);
  });
});
