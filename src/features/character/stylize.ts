import type { PortraitStyle } from './types';

/** Pixel buffer in RGBA order (same layout as ImageData.data). */
export type Pixels = Uint8ClampedArray;

const luminance = (r: number, g: number, b: number) => 0.299 * r + 0.587 * g + 0.114 * b;

function posterizeChannel(v: number, levels: number): number {
  const step = 255 / (levels - 1);
  return Math.round(Math.round(v / step) * step);
}

/** "Toy colors": boost saturation and contrast, then flatten to a few levels per channel. */
export function applyToyColors(px: Pixels): void {
  for (let i = 0; i < px.length; i += 4) {
    const r = px[i]!;
    const g = px[i + 1]!;
    const b = px[i + 2]!;
    const l = luminance(r, g, b);
    // Saturation 1.35x around luminance, contrast 1.1x around mid-gray.
    const adjust = (c: number) => ((l + (c - l) * 1.35) - 128) * 1.1 + 128;
    px[i] = posterizeChannel(Math.min(255, Math.max(0, adjust(r))), 6);
    px[i + 1] = posterizeChannel(Math.min(255, Math.max(0, adjust(g))), 6);
    px[i + 2] = posterizeChannel(Math.min(255, Math.max(0, adjust(b))), 6);
  }
}

// Classic yellow tritone: shadow -> skin -> highlight.
const SHADOW = [74, 52, 8] as const;
const SKIN = [255, 210, 63] as const;
const HIGHLIGHT = [255, 246, 200] as const;

/** "Classic yellow": map luminance onto a yellow toy-skin ramp in 5 bands, preserving features as shading. */
export function applyClassicYellow(px: Pixels): void {
  for (let i = 0; i < px.length; i += 4) {
    const l = luminance(px[i]!, px[i + 1]!, px[i + 2]!) / 255;
    const banded = Math.round(l * 4) / 4;
    const [from, to, t] = banded < 0.5 ? [SHADOW, SKIN, banded / 0.5] : [SKIN, HIGHLIGHT, (banded - 0.5) / 0.5];
    px[i] = from[0] + (to[0] - from[0]) * t;
    px[i + 1] = from[1] + (to[1] - from[1]) * t;
    px[i + 2] = from[2] + (to[2] - from[2]) * t;
  }
}

export function applyPortraitStyle(px: Pixels, style: PortraitStyle): void {
  if (style === 'toy') applyToyColors(px);
  else if (style === 'classicYellow') applyClassicYellow(px);
}
