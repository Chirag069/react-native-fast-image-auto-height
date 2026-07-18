import { invariant, warnOnce } from '../invariant';

describe('invariant', () => {
  it('does not throw when the condition holds', () => {
    expect(() => invariant(true, 'never shown')).not.toThrow();
  });

  it('throws with a branded message in development', () => {
    expect(() => invariant(false, 'autoHeight misuse')).toThrow(
      '[react-native-fast-image-auto-height] autoHeight misuse'
    );
  });
});

describe('warnOnce', () => {
  it('warns only once per unique message', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    warnOnce(false, 'duplicate style height');
    warnOnce(false, 'duplicate style height');
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it('does not warn when the condition holds', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    warnOnce(true, 'fine');
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});
