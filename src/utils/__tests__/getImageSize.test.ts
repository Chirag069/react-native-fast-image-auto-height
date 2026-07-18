import { Image } from 'react-native';
import { getImageSize } from '../getImageSize';

type SuccessCb = (width: number, height: number) => void;
type FailureCb = (error: unknown) => void;

describe('getImageSize', () => {
  const getSize = jest.spyOn(Image, 'getSize');
  const getSizeWithHeaders = jest.spyOn(Image, 'getSizeWithHeaders');

  afterEach(() => {
    getSize.mockReset();
    getSizeWithHeaders.mockReset();
  });

  it('resolves with dimensions from Image.getSize', async () => {
    getSize.mockImplementation((_uri, onSuccess) => {
      (onSuccess as SuccessCb)(640, 480);
    });
    await expect(getImageSize('https://a.com/1.jpg')).resolves.toEqual({
      width: 640,
      height: 480,
    });
    expect(getSizeWithHeaders).not.toHaveBeenCalled();
  });

  it('uses Image.getSizeWithHeaders when headers are provided', async () => {
    getSizeWithHeaders.mockImplementation((_uri, _headers, onSuccess) => {
      (onSuccess as SuccessCb)(100, 50);
    });
    await expect(
      getImageSize('https://a.com/1.jpg', { Authorization: 'token' })
    ).resolves.toEqual({ width: 100, height: 50 });
    expect(getSize).not.toHaveBeenCalled();
  });

  it('rejects when the probe fails', async () => {
    getSize.mockImplementation((_uri, _onSuccess, onFailure) => {
      (onFailure as FailureCb)(new Error('network down'));
    });
    await expect(getImageSize('https://a.com/1.jpg')).rejects.toThrow(
      'network down'
    );
  });

  it('normalizes non-Error failures into Errors', async () => {
    getSize.mockImplementation((_uri, _onSuccess, onFailure) => {
      (onFailure as FailureCb)('boom');
    });
    await expect(getImageSize('https://a.com/1.jpg')).rejects.toThrow(
      'Failed to get size'
    );
  });

  it('rejects on invalid reported dimensions', async () => {
    getSize.mockImplementation((_uri, onSuccess) => {
      (onSuccess as SuccessCb)(0, 0);
    });
    await expect(getImageSize('https://a.com/1.jpg')).rejects.toThrow(
      'invalid dimensions'
    );
  });
});
