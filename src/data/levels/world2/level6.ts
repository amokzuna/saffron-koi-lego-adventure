import type { LevelDefinition } from '../../../game/levels/types';
import { GROUND_TOP as GROUND_ROW, LEVEL_HEIGHT, ON_GROUND, brick, bridge, coins, deco, ground, sign } from '../helpers';

/**
 * 6 — Jungle Bridges: narrow wooden bridges over long drops, crumbling planks that fall shortly after
 * you stand on them, and spiked balls on slow, readable paths. Checkpoint before each crossing.
 */
export const LEVEL_6: LevelDefinition = {
  id: 'w2-2',
  name: 'Jungle Bridges',
  worldId: 2,
  theme: 'forest',
  width: 150,
  height: LEVEL_HEIGHT,
  spawn: { x: 3, y: ON_GROUND },
  goal: { x: 146, y: ON_GROUND },
  parTimeMs: 100_000,
  solids: [
    ground(0, 12),
    bridge(12, 16),
    ground(28, 6),
    ground(44, 8),
    bridge(55, 12, 11),
    ground(72, 10),
    ground(100, 14),
    bridge(114, 20),
    ground(134, 16),
  ],
  crumbling: [
    { id: 'w2-2-crumble-1', x: 34, y: GROUND_ROW, width: 10 },
    { id: 'w2-2-crumble-2', x: 83, y: 12, width: 3 },
    { id: 'w2-2-crumble-3', x: 88, y: 11, width: 3 },
    { id: 'w2-2-crumble-4', x: 93, y: 12, width: 3 },
  ],
  movingHazards: [
    { id: 'w2-2-ball-1', kind: 'spikeBall', x: 20, y: 9, dx: 0, dy: 4, periodMs: 2600 },
    { id: 'w2-2-ball-2', kind: 'spikeBall', x: 57, y: 10, dx: 7, dy: 0, periodMs: 3800 },
    { id: 'w2-2-ball-3', kind: 'spikeBall', x: 119, y: 9, dx: 0, dy: 4, periodMs: 2600 },
    { id: 'w2-2-ball-4', kind: 'spikeBall', x: 127, y: 9, dx: 0, dy: 4, periodMs: 2600, phaseMs: 1300 },
  ],
  collectibles: [
    ...coins('start', 5, ON_GROUND, 4),
    ...coins('bridge-1', 13, ON_GROUND, 5),
    ...coins('bridge-1b', 23, ON_GROUND, 4),
    ...coins('crumble-1', 35, 12, 8),
    ...coins('raised-bridge', 55, 10, 2),
    ...coins('raised-bridge-b', 65, 10, 2),
    ...coins('ledge', 73, ON_GROUND, 4),
    ...coins('steps', 83, 11, 3),
    ...coins('steps-b', 93, 11, 3),
    ...coins('long-bridge', 115, ON_GROUND, 3),
    ...coins('long-bridge-b', 123, ON_GROUND, 3),
    ...coins('long-bridge-c', 130, ON_GROUND, 3),
    ...coins('finish', 137, ON_GROUND, 6),
    brick('w2-2-brick-a', 25, 11),
    brick('w2-2-brick-b', 61, 7),
    brick('w2-2-brick-c', 89, 9),
  ],
  checkpoints: [
    { id: 'w2-2-cp-1', x: 30, y: ON_GROUND },
    { id: 'w2-2-cp-2', x: 46, y: ON_GROUND },
    { id: 'w2-2-cp-3', x: 74, y: ON_GROUND },
    { id: 'w2-2-cp-4', x: 102, y: ON_GROUND },
  ],
  hazards: [],
  enemies: [
    { id: 'w2-2-walker-1', kind: 'walker', x: 49, y: ON_GROUND, patrolMinX: 47, patrolMaxX: 51 },
    { id: 'w2-2-hopper-1', kind: 'hopper', x: 79, y: ON_GROUND, patrolMinX: 76, patrolMaxX: 81 },
    { id: 'w2-2-flyer-1', kind: 'flyer', x: 108, y: 11, patrolMinX: 103, patrolMaxX: 112 },
  ],
  powerUps: [{ id: 'w2-2-heart', kind: 'extraHeart', x: 101, y: ON_GROUND }],
  movingPlatforms: [],
  decorations: [
    sign(5, 'Watch the spiked balls, then cross!'),
    sign(31, 'Cracked planks fall — keep moving!'),
    deco('bush', 2),
    deco('mushroom', 45),
    deco('bush', 76),
    deco('mushroom', 106),
    deco('bush', 140),
  ],
};
