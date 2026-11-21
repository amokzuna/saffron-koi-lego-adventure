import type { LevelDefinition } from '../../../game/levels/types';
import { LEVEL_HEIGHT, ON_GROUND, brick, coins, deco, ground, platform, sign } from '../helpers';

/**
 * 4 — Grassland Guardian: a short warm-up, then the first boss arena. The boss is forgiving:
 * long telegraphs, a long stun window after hitting a wall, and platforms to escape its charge.
 */
export const LEVEL_4: LevelDefinition = {
  id: 'w1-4',
  name: 'Grassland Guardian',
  worldId: 1,
  theme: 'grassland',
  width: 80,
  height: LEVEL_HEIGHT,
  spawn: { x: 3, y: ON_GROUND },
  goal: { x: 61, y: ON_GROUND },
  parTimeMs: 120_000,
  solids: [ground(0, 30), ground(33, 47), platform(13, 10, 4), platform(21, 9, 3), platform(50, 11, 3), platform(68, 11, 3)],
  collectibles: [
    ...coins('start', 6, ON_GROUND, 4),
    ...coins('warmup', 13, 9, 4),
    ...coins('warmup-high', 21, 8, 3),
    ...coins('approach', 35, ON_GROUND, 5),
    brick('w1-4-brick-a', 15, 7),
    brick('w1-4-brick-b', 51, 10),
    brick('w1-4-brick-c', 69, 7),
  ],
  checkpoints: [{ id: 'w1-4-cp', x: 40, y: ON_GROUND }],
  hazards: [],
  enemies: [{ id: 'w1-4-walker', kind: 'walker', x: 26, y: ON_GROUND, patrolMinX: 23, patrolMaxX: 28 }],
  powerUps: [{ id: 'w1-4-heart', kind: 'extraHeart', x: 37, y: ON_GROUND }],
  movingPlatforms: [],
  decorations: [
    sign(42, 'Stomp the Guardian when it’s dizzy!'),
    deco('bush', 9),
    deco('flower', 18),
    deco('bush', 34),
  ],
  boss: {
    kind: 'guardian',
    name: 'Grassland Guardian',
    x: 72,
    y: ON_GROUND,
    arenaMinX: 44,
    arenaMaxX: 79,
    triggerX: 47,
  },
};
