import type { MovingPlatformPlacement } from '../levels/types';

/**
 * Eased ping-pong progress (0 -> 1 -> 0) over one period. Easing gives readable slow-downs
 * at each end, which are the natural boarding moments.
 */
export function pingPongProgress(clockMs: number, periodMs: number, phaseMs = 0): number {
  const t = (((clockMs + phaseMs) % periodMs) + periodMs) % periodMs;
  return (1 - Math.cos((t / periodMs) * Math.PI * 2)) / 2;
}

/** Top-left of the platform in tile units at the given game-clock time. */
export function movingPlatformTilePosition(p: MovingPlatformPlacement, clockMs: number): { x: number; y: number } {
  const k = pingPongProgress(clockMs, p.periodMs, p.phaseMs);
  return { x: p.x + p.dx * k, y: p.y + p.dy * k };
}

/** Evenly spaced positions along the path (inclusive of both ends), for level analysis. */
export function sampleMovingPlatformPath(p: MovingPlatformPlacement, samples: number): { x: number; y: number }[] {
  return Array.from({ length: samples }, (_, i) => {
    const k = samples === 1 ? 0 : i / (samples - 1);
    return { x: p.x + p.dx * k, y: p.y + p.dy * k };
  });
}
