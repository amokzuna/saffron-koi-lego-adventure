import { describe, expect, it } from 'vitest';
import { parseHeroProfile, sanitizeName, validateName } from './heroProfile';
import { DEFAULT_PROFILE } from './types';

describe('sanitizeName / validateName', () => {
  it('trims and collapses whitespace', () => {
    expect(sanitizeName('  Brick   Boss \n')).toBe('Brick Boss');
  });

  it('rejects empty and overly long names', () => {
    expect(validateName('   ')).not.toBeNull();
    expect(validateName('x'.repeat(17))).not.toBeNull();
    expect(validateName('x'.repeat(16))).toBeNull();
  });

  it('counts emoji as single characters', () => {
    expect(validateName('🧱'.repeat(16))).toBeNull();
  });
});

describe('parseHeroProfile', () => {
  it('returns defaults for missing or malformed data', () => {
    expect(parseHeroProfile(null)).toEqual(DEFAULT_PROFILE);
    expect(parseHeroProfile('nope')).toEqual(DEFAULT_PROFILE);
    expect(parseHeroProfile({ version: 99, name: 'Future' })).toEqual(DEFAULT_PROFILE);
  });

  it('migrates version 1 saves: a saved photo keeps photo mode, otherwise the original head', () => {
    const v1 = { version: 1, name: 'Old', torsoColor: 'green', legsColor: 'blue', style: 'toy' };
    expect(parseHeroProfile({ ...v1, hasPortrait: true })).toMatchObject({ version: 2, name: 'Old', faceMode: 'photo', skinTone: 'classic', hairStyle: 'none' });
    expect(parseHeroProfile({ ...v1, hasPortrait: false })).toMatchObject({ version: 2, faceMode: 'minifig', glasses: false });
  });

  it('falls back to the drawn head if photo mode has no saved photo', () => {
    expect(parseHeroProfile({ ...DEFAULT_PROFILE, faceMode: 'photo', hasPortrait: false }).faceMode).toBe('minifig');
  });

  it('keeps valid minifig options and repairs invalid ones', () => {
    const p = parseHeroProfile({ ...DEFAULT_PROFILE, skinTone: 'tan', hairColor: 'neon', hairStyle: 'spiky', glasses: true });
    expect(p).toMatchObject({ skinTone: 'tan', hairColor: DEFAULT_PROFILE.hairColor, hairStyle: 'spiky', glasses: true });
  });

  it('keeps valid fields and repairs invalid ones', () => {
    const profile = parseHeroProfile({
      version: 2,
      name: '  Ava ',
      torsoColor: 'green',
      legsColor: 'neon-pink',
      style: 'classicYellow',
      hasPortrait: 'yes',
    });
    expect(profile).toEqual({ ...DEFAULT_PROFILE, name: 'Ava', torsoColor: 'green', style: 'classicYellow', hasPortrait: false });
  });

  it('rejects prototype keys as colors', () => {
    expect(parseHeroProfile({ version: 2, torsoColor: '__proto__', skinTone: '__proto__' })).toMatchObject({
      torsoColor: DEFAULT_PROFILE.torsoColor,
      skinTone: DEFAULT_PROFILE.skinTone,
    });
  });
});
