import { describe, expect, it } from 'vitest';
import { analyzePhoto, colorDistance, medianColor, suggestMinifig, type PixelRegion, type RGB } from './analyzePhoto';

/** Builds a synthetic square "photo" from a function of normalized coordinates. */
function region(size: number, color: (u: number, v: number) => RGB): PixelRegion {
  const pixels = new Uint8ClampedArray(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const [r, g, b] = color(x / size, y / size);
      const i = (y * size + x) * 4;
      pixels.set([r, g, b, 255], i);
    }
  }
  return { pixels, width: size, height: size };
}

const SKIN: RGB = [235, 195, 160];
const BROWN_HAIR: RGB = [100, 66, 40];

describe('color helpers', () => {
  it('takes the per-channel median', () => {
    expect(medianColor([[0, 0, 0], [10, 20, 30], [200, 200, 200]])).toEqual([10, 20, 30]);
    expect(medianColor([])).toBeNull();
  });

  it('measures larger distances for more different colors', () => {
    expect(colorDistance([0, 0, 0], [0, 0, 0])).toBe(0);
    expect(colorDistance([200, 0, 0], [0, 0, 200])).toBeGreaterThan(colorDistance([200, 0, 0], [180, 20, 20]));
  });
});

describe('analyzePhoto + suggestMinifig', () => {
  it('finds skin, short hair, and the shirt below the face', () => {
    const face = region(60, (_u, v) => (v < 0.2 ? BROWN_HAIR : SKIN));
    const below = region(40, () => [40, 90, 200]);
    const suggestion = suggestMinifig(analyzePhoto(face, below));
    expect(suggestion).toEqual({ skinTone: 'light', hairColor: 'brown', hairStyle: 'short', torsoColor: 'blue' });
  });

  it('detects long hair from the sides of the face', () => {
    const face = region(60, (u, v) => (v < 0.2 || u < 0.15 || u > 0.85 ? [30, 25, 22] : [140, 95, 65]));
    const s = suggestMinifig(analyzePhoto(face, null));
    expect(s.hairStyle).toBe('long');
    expect(s.hairColor).toBe('black');
    expect(s.skinTone).toBe('brown');
    expect(s.torsoColor).toBeNull();
  });

  it('suggests no hair when the top of the photo matches the skin', () => {
    const s = suggestMinifig(analyzePhoto(region(40, () => SKIN), null));
    expect(s.hairStyle).toBe('none');
  });

  it('ignores small details like eyes when picking the skin tone', () => {
    const face = region(80, (u, v) => (Math.abs(u - 0.4) < 0.04 && Math.abs(v - 0.55) < 0.04 ? [10, 10, 10] : [92, 58, 38]));
    expect(suggestMinifig(analyzePhoto(face, null)).skinTone).toBe('deep');
  });
});
