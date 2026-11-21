import { describe, expect, it } from 'vitest';
import { formatTime } from './format';

describe('formatTime', () => {
  it.each([
    [0, '0:00.0'],
    [5_340, '0:05.3'],
    [65_399, '1:05.3'],
    [600_000, '10:00.0'],
    [-50, '0:00.0'],
  ])('formats %d ms as %s', (ms, expected) => {
    expect(formatTime(ms)).toBe(expected);
  });
});
