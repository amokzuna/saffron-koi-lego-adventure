import type { ThemeId } from '../levels/types';

/** Per-theme palettes for generated tiles and backgrounds. Colors are 0xRRGGBB. */
export interface ThemePalette {
  skyTop: number;
  skyBottom: number;
  /** Ground surface brick: base, highlight, shadow. */
  groundTop: [number, number, number];
  /** Ground fill: base, seam, highlight. */
  groundFill: [number, number, number];
  platform: [number, number, number];
  backdrop: 'hills' | 'trees' | 'cave' | 'dunes' | 'mountains' | 'castle' | 'volcano';
  /** Main colors for the far parallax layer. */
  far: [number, number];
  /** Top layer style and its color. */
  top: 'clouds' | 'mist' | 'stalactites' | 'haze' | 'snow' | 'embers';
  topColor: number;
  cameraBackground: string;
}

export const THEMES: Readonly<Record<ThemeId, ThemePalette>> = {
  grassland: {
    skyTop: 0x6cc0f0,
    skyBottom: 0xd9f2ff,
    groundTop: [0x3fa34d, 0x6fcf6b, 0x2b7a36],
    groundFill: [0xb8732f, 0x8f5520, 0xcd8a45],
    platform: [0xd93a2f, 0xf2675d, 0x9e241c],
    backdrop: 'hills',
    far: [0x86c96a, 0x9fd987],
    top: 'clouds',
    topColor: 0xffffff,
    cameraBackground: '#6cc0f0',
  },
  forest: {
    skyTop: 0x1f4a4a,
    skyBottom: 0x8fc7a0,
    groundTop: [0x3b7a3a, 0x63a85a, 0x24521f],
    groundFill: [0x5a3e2b, 0x3e2a1c, 0x6f4e37],
    platform: [0x8a4fbf, 0xb07ce0, 0x5e2f8a],
    backdrop: 'trees',
    far: [0x2e5e3e, 0x3f7a50],
    top: 'mist',
    topColor: 0xdff5e3,
    cameraBackground: '#1f4a4a',
  },
  cave: {
    skyTop: 0x0e0b1a,
    skyBottom: 0x2a2142,
    groundTop: [0x5b5577, 0x7d77a0, 0x3a3552],
    groundFill: [0x3a3552, 0x2a2640, 0x4a4466],
    platform: [0x2f8fa3, 0x5cc4d6, 0x1d5f6d],
    backdrop: 'cave',
    far: [0x221b36, 0x2f2650],
    top: 'stalactites',
    topColor: 0x1a142b,
    cameraBackground: '#0e0b1a',
  },
  desert: {
    skyTop: 0xf2b45c,
    skyBottom: 0xfde9b8,
    groundTop: [0xe0b45a, 0xf2d088, 0xb38a3a],
    groundFill: [0xc99a4a, 0xa87a32, 0xdcb062],
    platform: [0xc2603a, 0xe0835c, 0x8f4024],
    backdrop: 'dunes',
    far: [0xe8b968, 0xf2cf8a],
    top: 'haze',
    topColor: 0xfff3d6,
    cameraBackground: '#f2b45c',
  },
  pyramid: {
    skyTop: 0x1e150b,
    skyBottom: 0x4a3720,
    groundTop: [0xc9a15a, 0xe0bd7a, 0x8f6c34],
    groundFill: [0xa8823e, 0x7d5e28, 0xbf9a52],
    platform: [0x3a8f8f, 0x5cb8b8, 0x246060],
    backdrop: 'cave',
    far: [0x33240f, 0x4a361a],
    top: 'stalactites',
    topColor: 0x2a1d0f,
    cameraBackground: '#1e150b',
  },
  snow: {
    skyTop: 0x8fbfe8,
    skyBottom: 0xeaf4ff,
    groundTop: [0xe8f0f8, 0xffffff, 0xb8cadd],
    groundFill: [0x8fa4bd, 0x6e839c, 0xa8bcd3],
    platform: [0x5f8fcf, 0x8ab4ea, 0x3f6aa3],
    backdrop: 'mountains',
    far: [0xbcd0e6, 0xffffff],
    top: 'snow',
    topColor: 0xffffff,
    cameraBackground: '#8fbfe8',
  },
  castle: {
    skyTop: 0x1d2a44,
    skyBottom: 0x3a5070,
    groundTop: [0x8fb8d8, 0xc6e2f5, 0x5f86a6],
    groundFill: [0x56708f, 0x3d546f, 0x6b86a6],
    platform: [0x7a5fbf, 0xa58ae6, 0x54409a],
    backdrop: 'castle',
    far: [0x2a3a5a, 0x3a4f75],
    top: 'snow',
    topColor: 0xdbe9ff,
    cameraBackground: '#1d2a44',
  },
  volcano: {
    skyTop: 0x2b0d0d,
    skyBottom: 0x7a2a14,
    groundTop: [0x5a4545, 0x7a6262, 0x342626],
    groundFill: [0x3a2c2c, 0x241a1a, 0x4d3b3b],
    platform: [0x8a3b1f, 0xb85a30, 0x5c2410],
    backdrop: 'volcano',
    far: [0x3a1414, 0x5a1f1a],
    top: 'embers',
    topColor: 0xff9a3c,
    cameraBackground: '#2b0d0d',
  },
};

export const THEME_IDS = Object.keys(THEMES) as ThemeId[];

/** Texture key for a themed asset, e.g. themedKey('tile-ground-top', 'forest'). */
export const themedKey = (base: string, theme: ThemeId) => `${base}:${theme}`;
