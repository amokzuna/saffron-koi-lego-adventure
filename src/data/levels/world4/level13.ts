import type { LevelDefinition } from '../../../game/levels/types';
import { LEVEL_HEIGHT, ON_GROUND, brick, coins, ground, iceGround, icePlatform, sign } from '../helpers';

/**
 * 13 — Snowy Mountains: introduces ice carefully. The first ice stretch ends on normal ground (no pit),
 * so players learn the slide safely; later ice ends at gaps and on small platforms.
 */
export const LEVEL_13: LevelDefinition = {
  id: 'w4-1',
  name: 'Snowy Mountains',
  worldId: 4,
  theme: 'snow',
  width: 140,
  height: LEVEL_HEIGHT,
  spawn: { x: 3, y: ON_GROUND },
  goal: { x: 136, y: ON_GROUND },
  parTimeMs: 90_000,
  solids: [
    ground(0, 16),
    iceGround(16, 14),
    ground(30, 10),
    iceGround(44, 12),
    ground(60, 10),
    icePlatform(72, 11, 5),
    icePlatform(80, 10, 4),
    ground(88, 16),
    iceGround(108, 8),
    ground(116, 24),
  ],
  collectibles: [
    ...coins('start', 5, ON_GROUND, 4),
    ...coins('first-ice', 17, ON_GROUND, 10),
    ...coins('ice-2', 45, 12, 10),
    ...coins('ledges', 72, 10, 5),
    ...coins('ledges-2', 80, 9, 4),
    ...coins('valley', 90, ON_GROUND, 8),
    ...coins('finish', 118, ON_GROUND, 10),
    brick('w4-1-brick-a', 22, 10),
    brick('w4-1-brick-b', 82, 7),
    brick('w4-1-brick-c', 112, 10),
  ],
  checkpoints: [
    { id: 'w4-1-cp-1', x: 31, y: ON_GROUND },
    { id: 'w4-1-cp-2', x: 61, y: ON_GROUND },
    { id: 'w4-1-cp-3', x: 89, y: ON_GROUND },
    { id: 'w4-1-cp-4', x: 117, y: ON_GROUND },
  ],
  hazards: [],
  enemies: [
    { id: 'w4-1-walker-1', kind: 'walker', x: 50, y: ON_GROUND, patrolMinX: 46, patrolMaxX: 54 },
    { id: 'w4-1-hopper-1', kind: 'hopper', x: 96, y: ON_GROUND, patrolMinX: 90, patrolMaxX: 102 },
    { id: 'w4-1-flyer-1', kind: 'flyer', x: 125, y: 11, patrolMinX: 118, patrolMaxX: 132 },
  ],
  powerUps: [{ id: 'w4-1-heart', kind: 'extraHeart', x: 92, y: ON_GROUND }],
  movingPlatforms: [],
  decorations: [sign(5, 'Ice is slippery — start stopping early!'), sign(33, 'Ice ahead ends at a gap')],
};
