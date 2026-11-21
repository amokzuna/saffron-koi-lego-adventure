import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, parseSettings, prefersReducedMotion, showTouchControls } from './settings';

describe('parseSettings', () => {
  it('falls back to defaults for missing, corrupt, or future data', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings({ version: 9 })).toEqual(DEFAULT_SETTINGS);
  });

  it('clamps volumes and repairs invalid fields', () => {
    expect(parseSettings({ version: 1, masterVolume: 3, musicVolume: -1, sfxVolume: 'loud', reducedMotion: 'maybe', touchControls: 'always', muted: true })).toEqual({
      ...DEFAULT_SETTINGS,
      masterVolume: 1,
      musicVolume: 0,
      touchControls: 'always',
      muted: true,
    });
  });
});

describe('derived settings', () => {
  it('reduced motion follows the system only when set to system', () => {
    expect(prefersReducedMotion('system', true)).toBe(true);
    expect(prefersReducedMotion('off', true)).toBe(false);
    expect(prefersReducedMotion('on', false)).toBe(true);
  });

  it('touch controls follow device detection only in auto mode', () => {
    expect(showTouchControls('auto', true)).toBe(true);
    expect(showTouchControls('auto', false)).toBe(false);
    expect(showTouchControls('always', false)).toBe(true);
    expect(showTouchControls('never', true)).toBe(false);
  });
});
