import {
  DEFAULT_PROFILE,
  HAIR_COLORS,
  HAIR_STYLES,
  OUTFIT_COLORS,
  PORTRAIT_STYLES,
  SKIN_TONES,
  type HairColorId,
  type HairStyleId,
  type HeroProfile,
  type OutfitColorId,
  type PortraitStyle,
  type SkinToneId,
} from './types';

export const NAME_MAX_LENGTH = 16;

/** Trims, collapses whitespace, and strips control characters. */
export function sanitizeName(raw: string): string {
  return raw
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Returns an error message, or null when the name is acceptable. */
export function validateName(raw: string): string | null {
  const name = sanitizeName(raw);
  if (name.length === 0) return 'Please enter a name for your hero.';
  if ([...name].length > NAME_MAX_LENGTH) return `Names can be at most ${NAME_MAX_LENGTH} characters.`;
  return null;
}

const isOutfitColor = (v: unknown): v is OutfitColorId => typeof v === 'string' && Object.hasOwn(OUTFIT_COLORS, v);
const isStyle = (v: unknown): v is PortraitStyle => PORTRAIT_STYLES.some((s) => s.id === v);
const isSkin = (v: unknown): v is SkinToneId => typeof v === 'string' && Object.hasOwn(SKIN_TONES, v);
const isHairColor = (v: unknown): v is HairColorId => typeof v === 'string' && Object.hasOwn(HAIR_COLORS, v);
const isHairStyle = (v: unknown): v is HairStyleId => HAIR_STYLES.some((h) => h.id === v);

/** v1 had no minifig options: a saved photo meant photo mode; otherwise the original default head. */
function migrateV1(data: Record<string, unknown>): Record<string, unknown> {
  return { ...data, version: 2, faceMode: data.hasPortrait === true ? 'photo' : 'minifig', skinTone: 'classic', hairColor: 'brown', hairStyle: 'none', glasses: false };
}

/**
 * Parses stored hero data. Invalid fields fall back to defaults individually, and unknown
 * versions fall back entirely, so corrupt or outdated saves never crash the app.
 */
export function parseHeroProfile(raw: unknown): HeroProfile {
  if (typeof raw !== 'object' || raw === null) return { ...DEFAULT_PROFILE };
  let data = raw as Record<string, unknown>;
  if (data.version === 1) data = migrateV1(data);
  if (data.version !== 2) return { ...DEFAULT_PROFILE };
  const name = typeof data.name === 'string' && validateName(data.name) === null ? sanitizeName(data.name) : DEFAULT_PROFILE.name;
  const hasPortrait = data.hasPortrait === true;
  return {
    version: 2,
    name,
    torsoColor: isOutfitColor(data.torsoColor) ? data.torsoColor : DEFAULT_PROFILE.torsoColor,
    legsColor: isOutfitColor(data.legsColor) ? data.legsColor : DEFAULT_PROFILE.legsColor,
    style: isStyle(data.style) ? data.style : DEFAULT_PROFILE.style,
    hasPortrait,
    // Photo mode without a saved photo can't be shown, so it falls back to the drawn head.
    faceMode: data.faceMode === 'photo' && hasPortrait ? 'photo' : 'minifig',
    skinTone: isSkin(data.skinTone) ? data.skinTone : DEFAULT_PROFILE.skinTone,
    hairColor: isHairColor(data.hairColor) ? data.hairColor : DEFAULT_PROFILE.hairColor,
    hairStyle: isHairStyle(data.hairStyle) ? data.hairStyle : DEFAULT_PROFILE.hairStyle,
    glasses: data.glasses === true,
  };
}
