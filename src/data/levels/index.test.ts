import { describe, expect, it } from 'vitest';
import { DEFAULT_LEVEL_ID, resolveLevel } from '.';

describe('resolveLevel', () => {
  it('finds registered levels', () => {
    expect(resolveLevel('sandbox').id).toBe('sandbox');
    expect(resolveLevel('w1-3').name).toBe('Moving Platforms');
  });

  it('falls back to the default level', () => {
    expect(resolveLevel(null).id).toBe(DEFAULT_LEVEL_ID);
    expect(resolveLevel('does-not-exist').id).toBe(DEFAULT_LEVEL_ID);
    expect(resolveLevel('__proto__').id).toBe(DEFAULT_LEVEL_ID);
  });
});
