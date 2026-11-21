import type { LevelDefinition } from '../../../game/levels/types';
import { LEVEL_HEIGHT, ON_GROUND, brick, coins, deco, ground, platform, sign } from '../helpers';

/**
 * 8 — Forest Protector: warm-up with a hopper, then a flat arena. The boss crouches and marks its landing
 * spot, leaps there, sends shockwaves along the ground (jump them), then gets stuck — stomp it then.
 */
export const LEVEL_8: LevelDefinition = {
  id: 'w2-4',
  name: 'Forest Protector',
  worldId: 2,
  theme: 'forest',
  width: 80,
  height: LEVEL_HEIGHT,
  spawn: { x: 3, y: ON_GROUND },
  goal: { x: 61, y: ON_GROUND },
  parTimeMs: 120_000,
  solids: [ground(0, 30), ground(33, 47), platform(13, 10, 4), platform(22, 11, 4)],
  collectibles: [
    ...coins('start', 6, ON_GROUND, 4),
    ...coins('warmup', 13, 9, 4),
    ...coins('warmup-2', 22, 10, 4),
    ...coins('approach', 35, ON_GROUND, 5),
    brick('w2-4-brick-a', 15, 7),
    brick('w2-4-brick-b', 24, 9),
    brick('w2-4-brick-c', 52, 10),
  ],
  checkpoints: [{ id: 'w2-4-cp', x: 40, y: ON_GROUND }],
  hazards: [],
  enemies: [{ id: 'w2-4-hopper', kind: 'hopper', x: 26, y: ON_GROUND, patrolMinX: 22, patrolMaxX: 28 }],
  powerUps: [{ id: 'w2-4-heart', kind: 'extraHeart', x: 37, y: ON_GROUND }],
  movingPlatforms: [],
  decorations: [
    sign(42, 'Jump the shockwaves. Stomp it when it’s stuck!'),
    deco('mushroom', 9),
    deco('bush', 18),
    deco('mushroom', 34),
  ],
  boss: {
    kind: 'protector',
    name: 'Forest Protector',
    x: 70,
    y: ON_GROUND,
    arenaMinX: 44,
    arenaMaxX: 79,
    triggerX: 47,
  },
};
