import { describe, expect, it } from 'vitest';
import { installMode, isIos } from './installMode';

const env = (o: Partial<Parameters<typeof installMode>[0]> = {}) => ({
  standalone: false,
  hasPrompt: false,
  userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/130',
  platform: 'Linux armv8l',
  maxTouchPoints: 5,
  ...o,
});

describe('installMode', () => {
  it('offers nothing once installed', () => {
    expect(installMode(env({ standalone: true, hasPrompt: true }))).toBe('installed');
  });

  it('uses the browser prompt when available', () => {
    expect(installMode(env({ hasPrompt: true }))).toBe('prompt');
  });

  it('shows instructions on iPhone and iPad (including iPadOS reporting as a Mac)', () => {
    expect(installMode(env({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)', platform: 'iPhone' }))).toBe('ios');
    expect(isIos({ userAgent: 'Mozilla/5.0 (Macintosh)', platform: 'MacIntel', maxTouchPoints: 5 })).toBe(true);
    expect(isIos({ userAgent: 'Mozilla/5.0 (Macintosh)', platform: 'MacIntel', maxTouchPoints: 0 })).toBe(false);
  });

  it('offers nothing when the browser cannot install and it is not iOS', () => {
    expect(installMode(env())).toBe('unavailable');
  });
});
