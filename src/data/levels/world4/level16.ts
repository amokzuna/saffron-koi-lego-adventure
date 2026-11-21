import type { LevelDefinition } from '../../../game/levels/types';
import { LEVEL_HEIGHT, ON_GROUND, brick, coins, ground, iceGround, sign } from '../helpers';

/**
 * 16 — Frost Guardian: an icy warm-up, then the arena. Frost marks glow on alternating sections of the
 * floor before ice spikes erupt there, so a safe section is always one step away.
 */
export const LEVEL_16: LevelDefinition = {
  id: 'w4-4',
  name: 'Frost Guardian',
  worldId: 4,
  theme: 'castle',
  width: 80,
  height: LEVEL_HEIGHT,
  spawn: { x: 3, y: ON_GROUND },
  goal: { x: 61, y: ON_GROUND },
  parTimeMs: 140_000,
  solids: [ground(0, 10), iceGround(10, 14), ground(24, 6), ground(33, 47)],
  collectibles: [
    ...coins('start', 4, ON_GROUND, 4),
    ...coins('ice', 11, ON_GROUND, 10),
    ...coins('approach', 34, ON_GROUND, 5),
    brick('w4-4-brick-a', 14, 10),
    brick('w4-4-brick-b', 27, 10),
    brick('w4-4-brick-c', 52, 10),
  ],
  checkpoints: [{ id: 'w4-4-cp', x: 40, y: ON_GROUND }],
  hazards: [],
  enemies: [{ id: 'w4-4-hopper', kind: 'hopper', x: 18, y: ON_GROUND, patrolMinX: 12, patrolMaxX: 22 }],
  powerUps: [{ id: 'w4-4-heart', kind: 'extraHeart', x: 37, y: ON_GROUND }],
  movingPlatforms: [],
  decorations: [sign(42, 'Avoid the glowing frost. Stomp it when it kneels!')],
  boss: { kind: 'frost', name: 'Frost Guardian', x: 72, y: ON_GROUND, arenaMinX: 44, arenaMaxX: 79, triggerX: 47 },
};
