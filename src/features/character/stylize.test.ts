import { describe, expect, it } from 'vitest';
import { applyClassicYellow, applyPortraitStyle, applyToyColors } from './stylize';

const pixel = (r: number, g: number, b: number, a = 255) => new Uint8ClampedArray([r, g, b, a]);

describe('applyToyColors', () => {
  it('snaps channels to a small palette', () => {
    const px = pixel(37, 140, 201);
    applyToyColors(px);
    for (const v of px.slice(0, 3)) expect([0, 51, 102, 153, 204, 255]).toContain(v);
  });

  it('keeps black and white and preserves alpha', () => {
    const px = new Uint8ClampedArray([0, 0, 0, 77, 255, 255, 255, 12]);
    applyToyColors(px);
    expect([...px]).toEqual([0, 0, 0, 77, 255, 255, 255, 12]);
  });
});

describe('applyClassicYellow', () => {
  it('maps mid-gray to toy-skin yellow', () => {
    const px = pixel(128, 128, 128);
    applyClassicYellow(px);
    expect([...px.slice(0, 3)]).toEqual([255, 210, 63]);
  });

  it('keeps light/dark ordering so features stay readable', () => {
    const dark = pixel(30, 30, 30);
    const light = pixel(220, 220, 220);
    applyClassicYellow(dark);
    applyClassicYellow(light);
    expect(dark[0]! + dark[1]! + dark[2]!).toBeLessThan(light[0]! + light[1]! + light[2]!);
  });
});

describe('applyPortraitStyle', () => {
  it('leaves the original style untouched', () => {
    const px = pixel(1, 2, 3);
    applyPortraitStyle(px, 'original');
    expect([...px]).toEqual([1, 2, 3, 255]);
  });
});
