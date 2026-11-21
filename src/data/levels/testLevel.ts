import type { CollectiblePlacement, LevelDefinition, SolidBlock } from '../../game/levels/types';

/**
 * Test level: running, jumping, collecting, pits, then (Milestone 2) spikes, enemies,
 * checkpoints, and power-ups. Each threat is introduced on flat ground with room to react,
 * and a checkpoint sits before each new section.
 * Ground surface is row 14; the level is 17 tiles tall (rows 14–16 are ground).
 */
const GROUND_TOP = 14;
const LEVEL_HEIGHT = 17;

const ground = (x: number, width: number): SolidBlock => ({
  x,
  y: GROUND_TOP,
  width,
  height: LEVEL_HEIGHT - GROUND_TOP,
  style: 'ground',
});

const platform = (x: number, y: number, width: number): SolidBlock => ({ x, y, width, height: 1, style: 'platform' });

const coinRow = (prefix: string, x: number, y: number, count: number): CollectiblePlacement[] =>
  Array.from({ length: count }, (_, i) => ({ id: `${prefix}-${i}`, kind: 'coin' as const, x: x + i, y }));

export const TEST_LEVEL: LevelDefinition = {
  id: 'test-1',
  name: 'Brick Meadow (Dev Test)',
  worldId: 1,
  theme: 'grassland',
  width: 120,
  height: LEVEL_HEIGHT,
  spawn: { x: 3, y: GROUND_TOP - 1 },
  goal: { x: 115, y: GROUND_TOP - 1 },
  parTimeMs: 60_000,
  solids: [
    // Ground segments; gaps between them are pits.
    ground(0, 30),
    ground(34, 24),
    ground(62, 28),
    ground(94, 26),
    // Step-up staircase teaching jumps
    platform(12, 11, 4),
    platform(18, 8, 4),
    platform(24, 11, 3),
    // Over the first pit area
    platform(40, 11, 3),
    platform(45, 8, 4),
    platform(51, 11, 3),
    // Raised wall to hop over (a ground block on top of ground)
    { x: 66, y: 12, width: 2, height: 2, style: 'ground' },
    platform(72, 10, 5),
    platform(80, 7, 3),
    // Final run
    platform(99, 11, 3),
    platform(104, 9, 3),
  ],
  collectibles: [
    ...coinRow('start', 6, GROUND_TOP - 1, 4),
    ...coinRow('stair-a', 12, 10, 4),
    ...coinRow('stair-b', 18, 7, 4),
    ...coinRow('pit-1', 30, 11, 4),
    ...coinRow('float-a', 45, 7, 4),
    ...coinRow('mid', 54, GROUND_TOP - 1, 3),
    ...coinRow('pit-2', 58, 11, 4),
    ...coinRow('wall', 66, 11, 2),
    ...coinRow('ledge', 72, 9, 5),
    ...coinRow('pit-3', 90, 11, 4),
    ...coinRow('end', 104, 8, 3),
    { id: 'brick-high', kind: 'brick', x: 20, y: 5 },
    { id: 'brick-sky', kind: 'brick', x: 81, y: 4 },
    { id: 'brick-final', kind: 'brick', x: 110, y: GROUND_TOP - 1 },
  ],
  checkpoints: [
    { id: 'cp-1', x: 36, y: GROUND_TOP - 1 },
    { id: 'cp-2', x: 64, y: GROUND_TOP - 1 },
    { id: 'cp-3', x: 96, y: GROUND_TOP - 1 },
  ],
  hazards: [
    // First spikes sit under a platform route, so they can be avoided or jumped.
    { id: 'spikes-1', kind: 'spikes', x: 46, y: GROUND_TOP - 1, width: 2 },
    { id: 'spikes-2', kind: 'spikes', x: 84, y: GROUND_TOP - 1, width: 3 },
  ],
  enemies: [
    { id: 'walker-1', kind: 'walker', x: 54, y: GROUND_TOP - 1, patrolMinX: 50, patrolMaxX: 57 },
    { id: 'walker-2', kind: 'walker', x: 76, y: GROUND_TOP - 1, patrolMinX: 69, patrolMaxX: 82 },
    { id: 'flyer-1', kind: 'flyer', x: 104, y: 12, patrolMinX: 98, patrolMaxX: 110 },
  ],
  powerUps: [
    { id: 'pu-super-jump', kind: 'superJump', x: 15, y: GROUND_TOP - 1 },
    { id: 'pu-shield', kind: 'shield', x: 65, y: GROUND_TOP - 1 },
    { id: 'pu-heart', kind: 'extraHeart', x: 81, y: 6 },
    { id: 'pu-speed', kind: 'speedBoost', x: 97, y: GROUND_TOP - 1 },
  ],
  movingPlatforms: [],
  decorations: [],
};
