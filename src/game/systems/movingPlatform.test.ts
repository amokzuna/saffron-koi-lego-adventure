import { describe, expect, it } from 'vitest';
import { movingPlatformTilePosition, pingPongProgress, sampleMovingPlatformPath } from './movingPlatform';

const platform = { id: 'm', x: 10, y: 5, width: 3, dx: 4, dy: -2, periodMs: 4000 };

describe('moving platforms', () => {
  it('ping-pongs from start to end and back over one period', () => {
    expect(pingPongProgress(0, 4000)).toBeCloseTo(0);
    expect(pingPongProgress(2000, 4000)).toBeCloseTo(1);
    expect(pingPongProgress(4000, 4000)).toBeCloseTo(0);
    expect(pingPongProgress(1000, 4000)).toBeCloseTo(0.5);
  });

  it('applies the phase offset', () => {
    expect(pingPongProgress(0, 4000, 2000)).toBeCloseTo(1);
  });

  it('positions the platform along its path', () => {
    expect(movingPlatformTilePosition(platform, 2000)).toEqual({ x: 14, y: 3 });
    expect(movingPlatformTilePosition(platform, 0)).toEqual({ x: 10, y: 5 });
  });

  it('samples both ends of the path', () => {
    const samples = sampleMovingPlatformPath(platform, 3);
    expect(samples).toEqual([
      { x: 10, y: 5 },
      { x: 12, y: 4 },
      { x: 14, y: 3 },
    ]);
  });
});
