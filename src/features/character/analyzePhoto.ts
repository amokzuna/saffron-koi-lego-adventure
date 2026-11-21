import type { Pixels } from './stylize';
import { HAIR_COLORS, OUTFIT_COLORS, SKIN_TONES, type HairColorId, type HairStyleId, type OutfitColorId, type SkinToneId } from './types';

/**
 * Builds minifigure suggestions from a photo, entirely on-device, using simple color sampling:
 * - skin: the center of the face region (skin-like pixels preferred)
 * - hair: a band across the top of the crop, and side bands for long hair
 * - shirt: the area just below the crop, when the photo extends below the face
 * These are suggestions only; the player can change every one.
 */
export type RGB = [number, number, number];

export interface PixelRegion {
  pixels: Pixels;
  width: number;
  height: number;
}

export interface PhotoTraits {
  skin: RGB;
  hair: RGB | null;
  longHair: boolean;
  shirt: RGB | null;
}

export interface MinifigSuggestion {
  skinTone: SkinToneId;
  hairColor: HairColorId;
  hairStyle: HairStyleId;
  torsoColor: OutfitColorId | null;
}

/** Fractions of the square face crop used for sampling. */
const SKIN_BOX = { x0: 0.33, x1: 0.67, y0: 0.45, y1: 0.72 };
const HAIR_BOX = { x0: 0.25, x1: 0.75, y0: 0.02, y1: 0.16 };
const SIDE_BOXES = [
  { x0: 0.0, x1: 0.12, y0: 0.45, y1: 0.8 },
  { x0: 0.88, x1: 1.0, y0: 0.45, y1: 0.8 },
];
/** Color distance above which the top band counts as hair rather than skin. */
const HAIR_THRESHOLD = 60;

function sample(region: PixelRegion, box: { x0: number; x1: number; y0: number; y1: number }): RGB[] {
  const out: RGB[] = [];
  const xs = Math.floor(box.x0 * region.width);
  const xe = Math.max(xs + 1, Math.floor(box.x1 * region.width));
  const ys = Math.floor(box.y0 * region.height);
  const ye = Math.max(ys + 1, Math.floor(box.y1 * region.height));
  for (let y = ys; y < ye; y++) {
    for (let x = xs; x < xe; x++) {
      const i = (y * region.width + x) * 4;
      if ((region.pixels[i + 3] ?? 255) < 128) continue; // ignore transparent pixels
      out.push([region.pixels[i]!, region.pixels[i + 1]!, region.pixels[i + 2]!]);
    }
  }
  return out;
}

/** Per-channel median: robust to small details like eyes, glasses, or highlights. */
export function medianColor(colors: readonly RGB[]): RGB | null {
  if (colors.length === 0) return null;
  const channel = (c: 0 | 1 | 2) => {
    const values = colors.map((p) => p[c]).sort((a, b) => a - b);
    return values[Math.floor(values.length / 2)]!;
  };
  return [channel(0), channel(1), channel(2)];
}

/** Approximate perceptual distance (weighted RGB, "redmean"). */
export function colorDistance(a: RGB, b: RGB): number {
  const rMean = (a[0] + b[0]) / 2;
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return Math.sqrt((2 + rMean / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rMean) / 256) * db * db);
}

export function hexToRgb(hex: string): RGB {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function nearest<T extends string>(color: RGB, palette: Readonly<Record<T, { hex: string }>>, exclude: readonly T[] = []): T {
  let best: T | null = null;
  let bestDistance = Infinity;
  for (const id of Object.keys(palette) as T[]) {
    if (exclude.includes(id)) continue;
    const d = colorDistance(color, hexToRgb(palette[id].hex));
    if (d < bestDistance) {
      bestDistance = d;
      best = id;
    }
  }
  return best!;
}

const isSkinLike = ([r, g, b]: RGB) => r > 60 && r >= g && g >= b * 0.8 && r - b > 15;

export function analyzePhoto(face: PixelRegion, below: PixelRegion | null): PhotoTraits {
  const skinSamples = sample(face, SKIN_BOX);
  const skinLike = skinSamples.filter(isSkinLike);
  const skin = medianColor(skinLike.length >= skinSamples.length * 0.2 ? skinLike : skinSamples) ?? [255, 210, 63];

  const top = medianColor(sample(face, HAIR_BOX));
  const hair = top && colorDistance(top, skin) > HAIR_THRESHOLD ? top : null;

  const longHair =
    hair !== null &&
    SIDE_BOXES.every((box) => {
      const side = medianColor(sample(face, box));
      return side !== null && colorDistance(side, hair) < colorDistance(side, skin);
    });

  const shirt = below ? medianColor(sample(below, { x0: 0.25, x1: 0.75, y0: 0.2, y1: 0.9 })) : null;
  return { skin, hair, longHair, shirt };
}

export function suggestMinifig(traits: PhotoTraits): MinifigSuggestion {
  return {
    // The classic yellow is a style choice, so photos map to the natural tones.
    skinTone: nearest(traits.skin, SKIN_TONES, ['classic']),
    hairColor: traits.hair ? nearest(traits.hair, HAIR_COLORS) : 'brown',
    hairStyle: traits.hair ? (traits.longHair ? 'long' : 'short') : 'none',
    torsoColor: traits.shirt ? nearest(traits.shirt, OUTFIT_COLORS) : null,
  };
}
