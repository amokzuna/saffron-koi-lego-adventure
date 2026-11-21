import { describe, expect, it } from 'vitest';
import { SANDBOX_LEVEL } from '../../data/levels/sandboxLevel';
import { MOVEMENT } from '../config/movement';
import { analyzeReachability } from './reachability';
import type { LevelDefinition } from './types';

const flat = (overrides: Partial<LevelDefinition> = {}): LevelDefinition => ({
  ...structuredClone(SANDBOX_LEVEL),
  collectibles: [],
  ...overrides,
});

describe('analyzeReachability', () => {
  it('reaches the goal and collectibles on a flat level', () => {
    const report = analyzeReachability(SANDBOX_LEVEL, MOVEMENT);
    expect(report.goalReachable).toBe(true);
    expect(report.unreachableCollectibles).toEqual([]);
  });

  it('flags a brick placed higher than the max jump', () => {
    const level = flat({ collectibles: [{ id: 'too-high', kind: 'brick', x: 10, y: 4 }] });
    expect(analyzeReachability(level, MOVEMENT).unreachableCollectibles).toEqual(['too-high']);
  });

  it('flags a pit wider than the max jump distance', () => {
    const level = flat({
      solids: [
        { x: 2, y: 14, width: 10, height: 3, style: 'ground' },
        { x: 22, y: 14, width: 22, height: 3, style: 'ground' },
      ],
    });
    expect(analyzeReachability(level, MOVEMENT).goalReachable).toBe(false);
  });

  it('a moving platform can bridge a pit too wide to jump', () => {
    const level = flat({
      solids: [
        { x: 2, y: 14, width: 10, height: 3, style: 'ground' },
        { x: 22, y: 14, width: 22, height: 3, style: 'ground' },
      ],
      movingPlatforms: [{ id: 'bridge', x: 12, y: 14, width: 3, dx: 7, dy: 0, periodMs: 4000 }],
    });
    expect(analyzeReachability(level, MOVEMENT).goalReachable).toBe(true);
  });

  it('a wall taller than the max jump blocks progress', () => {
    const level = flat({
      solids: [
        { x: 2, y: 14, width: 42, height: 3, style: 'ground' },
        { x: 20, y: 8, width: 2, height: 6, style: 'ground' },
      ],
    });
    expect(analyzeReachability(level, MOVEMENT).goalReachable).toBe(false);
  });
});

describe('analyzeReachability with Worlds 3–5 mechanics', () => {
  it('opens doors once their switch is reachable', () => {
    const level = flat({
      switches: [{ id: 'sw', x: 8, y: 13 }],
      doors: [{ id: 'door', switchId: 'sw', x: 20, y: 8, width: 1, height: 6 }],
    });
    expect(analyzeReachability(level, MOVEMENT).goalReachable).toBe(true);
  });

  it('a door whose switch is behind it blocks the goal', () => {
    const level = flat({
      switches: [{ id: 'sw', x: 30, y: 13 }],
      doors: [{ id: 'door', switchId: 'sw', x: 20, y: 8, width: 1, height: 6 }],
    });
    expect(analyzeReachability(level, MOVEMENT).goalReachable).toBe(false);
  });

  it('lava wider than a jump blocks progress; a narrow lava pool can be jumped', () => {
    const wide = flat({ hazards: [{ id: 'lava', kind: 'lava', x: 10, y: 13, width: 9 }] });
    expect(analyzeReachability(wide, MOVEMENT).goalReachable).toBe(false);
    const narrow = flat({ hazards: [{ id: 'lava', kind: 'lava', x: 10, y: 13, width: 3 }] });
    expect(analyzeReachability(narrow, MOVEMENT).goalReachable).toBe(true);
  });
});
