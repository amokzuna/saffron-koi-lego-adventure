import type { CollectiblePlacement, DecorationKind, DecorationPlacement, HazardPlacement, SolidBlock } from '../../game/levels/types';

/** Shared authoring helpers. Levels are 17 tiles tall with the main ground surface at row 14. */
export const LEVEL_HEIGHT = 17;
export const GROUND_TOP = 14;
/** Row for things standing on the main ground. */
export const ON_GROUND = GROUND_TOP - 1;

export const ground = (x: number, width: number, top = GROUND_TOP): SolidBlock => ({
  x,
  y: top,
  width,
  height: LEVEL_HEIGHT - top,
  style: 'ground',
});

export const platform = (x: number, y: number, width: number): SolidBlock => ({ x, y, width, height: 1, style: 'platform' });

export const coins = (prefix: string, x: number, y: number, count: number, step = 1): CollectiblePlacement[] =>
  Array.from({ length: count }, (_, i) => ({ id: `${prefix}-${i}`, kind: 'coin' as const, x: x + i * step, y }));

/** Coins along an arc over a gap: rises then falls. */
export const coinArc = (prefix: string, x: number, baseY: number, count: number): CollectiblePlacement[] =>
  Array.from({ length: count }, (_, i) => {
    const mid = (count - 1) / 2;
    const lift = Math.round(2 - (Math.abs(i - mid) / Math.max(mid, 1)) * 2);
    return { id: `${prefix}-${i}`, kind: 'coin' as const, x: x + i, y: baseY - lift };
  });

export const brick = (id: string, x: number, y: number): CollectiblePlacement => ({ id, kind: 'brick', x, y });

export const deco = (kind: DecorationKind, x: number, y = ON_GROUND): DecorationPlacement => ({ kind, x, y });

export const sign = (x: number, text: string, y = ON_GROUND): DecorationPlacement => ({ kind: 'sign', x, y, text });

export const bridge = (x: number, width: number, y = GROUND_TOP): SolidBlock => ({ x, y, width, height: 1, style: 'bridge' });

/** Glow mushroom decoration (also a light source in dark levels). */
export const glow = (x: number, y = ON_GROUND): DecorationPlacement => ({ kind: 'glowMushroom', x, y });

/** Slippery ground (top at `top`, filling to the level bottom). */
export const iceGround = (x: number, width: number, top = GROUND_TOP): SolidBlock => ({ x, y: top, width, height: LEVEL_HEIGHT - top, style: 'ice' });

export const icePlatform = (x: number, y: number, width: number): SolidBlock => ({ x, y, width, height: 1, style: 'ice' });

/** A lava basin: low ground one row below the main surface, filled with lava on the main surface row. */
export const lavaBasin = (id: string, x: number, width: number): { solid: SolidBlock; lava: HazardPlacement } => ({
  solid: ground(x, width, GROUND_TOP + 1),
  lava: { id, kind: 'lava', x, y: GROUND_TOP, width },
});
