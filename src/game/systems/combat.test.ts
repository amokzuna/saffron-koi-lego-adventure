import { describe, expect, it } from 'vitest';
import { isStomp, knockbackDirection, nextPatrolDirection } from './combat';

describe('isStomp', () => {
  const base = { enemyTop: 400, tolerancePx: 10 };

  it('counts a falling player whose feet were above the enemy', () => {
    expect(isStomp({ ...base, playerPreviousBottom: 398, playerVelocityY: 300 })).toBe(true);
  });

  it('allows a small tolerance for fast falls', () => {
    expect(isStomp({ ...base, playerPreviousBottom: 409, playerVelocityY: 600 })).toBe(true);
  });

  it('rejects side contact', () => {
    expect(isStomp({ ...base, playerPreviousBottom: 430, playerVelocityY: 0 })).toBe(false);
  });

  it('rejects a rising player even from above', () => {
    expect(isStomp({ ...base, playerPreviousBottom: 390, playerVelocityY: -200 })).toBe(false);
  });
});

describe('knockbackDirection', () => {
  it('pushes away from the source', () => {
    expect(knockbackDirection(100, 150)).toBe(-1);
    expect(knockbackDirection(200, 150)).toBe(1);
  });
});

describe('nextPatrolDirection', () => {
  const base = { minX: 100, maxX: 200, blockedLeft: false, blockedRight: false };

  it('keeps going inside the range', () => {
    expect(nextPatrolDirection({ ...base, x: 150, direction: 1 })).toBe(1);
  });

  it('turns at the bounds', () => {
    expect(nextPatrolDirection({ ...base, x: 200, direction: 1 })).toBe(-1);
    expect(nextPatrolDirection({ ...base, x: 100, direction: -1 })).toBe(1);
  });

  it('turns when blocked by a wall', () => {
    expect(nextPatrolDirection({ ...base, x: 150, direction: 1, blockedRight: true })).toBe(-1);
  });
});
