import { calculateHeight } from '../calculateHeight';
import { calculateWidth } from '../calculateWidth';

describe('calculateHeight', () => {
  it('derives height from width and aspect ratio', () => {
    // aspectRatio = width / height => height = width / aspectRatio
    expect(calculateHeight(200, 2)).toBe(100);
    expect(calculateHeight(300, 1.5)).toBe(200);
  });

  it('returns undefined for missing inputs', () => {
    expect(calculateHeight(undefined, 2)).toBeUndefined();
    expect(calculateHeight(200, undefined)).toBeUndefined();
  });

  it('returns undefined for non-positive or non-finite inputs', () => {
    expect(calculateHeight(0, 2)).toBeUndefined();
    expect(calculateHeight(-10, 2)).toBeUndefined();
    expect(calculateHeight(200, 0)).toBeUndefined();
    expect(calculateHeight(200, -1)).toBeUndefined();
    expect(calculateHeight(NaN, 2)).toBeUndefined();
    expect(calculateHeight(200, Infinity)).toBeUndefined();
  });
});

describe('calculateWidth', () => {
  it('derives width from height and aspect ratio', () => {
    expect(calculateWidth(100, 2)).toBe(200);
    expect(calculateWidth(200, 0.5)).toBe(100);
  });

  it('returns undefined for invalid inputs', () => {
    expect(calculateWidth(undefined, 2)).toBeUndefined();
    expect(calculateWidth(100, undefined)).toBeUndefined();
    expect(calculateWidth(0, 2)).toBeUndefined();
    expect(calculateWidth(100, NaN)).toBeUndefined();
  });
});
