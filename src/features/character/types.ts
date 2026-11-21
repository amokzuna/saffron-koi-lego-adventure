/** Visual treatment applied to the uploaded portrait. */
export type PortraitStyle = 'toy' | 'classicYellow' | 'original';

export const PORTRAIT_STYLES: readonly { id: PortraitStyle; label: string; description: string }[] = [
  { id: 'toy', label: 'Toy colors', description: 'Bold, simplified colors like a printed toy face.' },
  { id: 'classicYellow', label: 'Classic yellow', description: 'Yellow toy-skin tones that keep your shading and features.' },
  { id: 'original', label: 'Original', description: 'Your photo colors, unchanged.' },
];

export type OutfitColorId = 'red' | 'blue' | 'green' | 'orange' | 'purple' | 'black' | 'white' | 'gray';

export const OUTFIT_COLORS: Readonly<Record<OutfitColorId, { label: string; hex: string; shade: string }>> = {
  red: { label: 'Red', hex: '#e5372c', shade: '#b4271f' },
  blue: { label: 'Blue', hex: '#2b63c9', shade: '#1d4590' },
  green: { label: 'Green', hex: '#2e9e4f', shade: '#1f7036' },
  orange: { label: 'Orange', hex: '#f08a24', shade: '#b8640f' },
  purple: { label: 'Purple', hex: '#7b3fa0', shade: '#5a2a78' },
  black: { label: 'Black', hex: '#2b2f38', shade: '#15181e' },
  white: { label: 'White', hex: '#eef0f3', shade: '#b9bec7' },
  gray: { label: 'Gray', hex: '#8d99a6', shade: '#5f6a75' },
};

export const OUTFIT_COLOR_IDS = Object.keys(OUTFIT_COLORS) as OutfitColorId[];

/**
 * How the hero's face is drawn:
 * - 'minifig': a drawn minifigure head (skin tone, hairpiece, glasses), optionally built from a photo's colors.
 * - 'photo': the cropped photo itself, styled, on the head.
 */
export type FaceMode = 'minifig' | 'photo';

export type SkinToneId = 'classic' | 'porcelain' | 'light' | 'medium' | 'tan' | 'brown' | 'deep';

export const SKIN_TONES: Readonly<Record<SkinToneId, { label: string; hex: string; shade: string }>> = {
  classic: { label: 'Classic yellow', hex: '#ffd23f', shade: '#d9a91a' },
  porcelain: { label: 'Porcelain', hex: '#f6dccb', shade: '#d8b8a3' },
  light: { label: 'Light', hex: '#eac3a2', shade: '#c99f7e' },
  medium: { label: 'Medium', hex: '#d4a07a', shade: '#b07e5a' },
  tan: { label: 'Tan', hex: '#b57e57', shade: '#93613e' },
  brown: { label: 'Brown', hex: '#8d5a3b', shade: '#6d4329' },
  deep: { label: 'Deep brown', hex: '#5c3a26', shade: '#432918' },
};
export const SKIN_TONE_IDS = Object.keys(SKIN_TONES) as SkinToneId[];

export type HairColorId = 'black' | 'darkBrown' | 'brown' | 'blonde' | 'ginger' | 'gray' | 'white' | 'blue' | 'pink';

export const HAIR_COLORS: Readonly<Record<HairColorId, { label: string; hex: string }>> = {
  black: { label: 'Black', hex: '#1f1a17' },
  darkBrown: { label: 'Dark brown', hex: '#3e2a1e' },
  brown: { label: 'Brown', hex: '#6b4428' },
  blonde: { label: 'Blonde', hex: '#d9b36b' },
  ginger: { label: 'Ginger', hex: '#b5532a' },
  gray: { label: 'Gray', hex: '#9a9a9a' },
  white: { label: 'White', hex: '#e8e6e1' },
  blue: { label: 'Blue', hex: '#3f6fd8' },
  pink: { label: 'Pink', hex: '#e86fb0' },
};
export const HAIR_COLOR_IDS = Object.keys(HAIR_COLORS) as HairColorId[];

export type HairStyleId = 'none' | 'short' | 'long' | 'spiky';

export const HAIR_STYLES: readonly { id: HairStyleId; label: string }[] = [
  { id: 'none', label: 'No hair' },
  { id: 'short', label: 'Short' },
  { id: 'long', label: 'Long' },
  { id: 'spiky', label: 'Spiky' },
];

/** Persisted hero metadata (the portrait image itself is stored separately in IndexedDB, photo mode only). */
export interface HeroProfile {
  version: 2;
  name: string;
  torsoColor: OutfitColorId;
  legsColor: OutfitColorId;
  style: PortraitStyle;
  hasPortrait: boolean;
  faceMode: FaceMode;
  skinTone: SkinToneId;
  hairColor: HairColorId;
  hairStyle: HairStyleId;
  glasses: boolean;
}

export const DEFAULT_HERO_NAME = 'Hero';

/** Defaults reproduce the original placeholder hero: classic yellow head, no hair, no glasses. */
export const DEFAULT_PROFILE: HeroProfile = {
  version: 2,
  name: DEFAULT_HERO_NAME,
  torsoColor: 'red',
  legsColor: 'blue',
  style: 'toy',
  hasPortrait: false,
  faceMode: 'minifig',
  skinTone: 'classic',
  hairColor: 'brown',
  hairStyle: 'none',
  glasses: false,
};

/** Image types the app produces for portraits (decoded uploads, crops, stored images). */
export type PortraitSource = HTMLCanvasElement | ImageBitmap | HTMLImageElement;

/** Everything needed to draw the hero. `portrait` is the cropped, unstyled face image (or null for the default face). */
export interface HeroAppearance {
  name: string;
  torsoColor: OutfitColorId;
  legsColor: OutfitColorId;
  style: PortraitStyle;
  portrait: PortraitSource | null;
  faceMode: FaceMode;
  skinTone: SkinToneId;
  hairColor: HairColorId;
  hairStyle: HairStyleId;
  glasses: boolean;
}
