import type { LevelDefinition } from '../../../game/levels/types';
import { LEVEL_HEIGHT, ON_GROUND, brick, coins, ground, iceGround, icePlatform, sign } from '../helpers';

/**
 * 14 — Ice Slides: momentum. Boost pads launch the hero along long ice runs; gaps are always within a
 * normal jump (boosts make them comfortable), and spikes after landings test control at speed.
 * Note: true slopes are not supported by the AABB physics; momentum comes from ice and boost pads.
 */
export const LEVEL_14: LevelDefinition = {
  id: 'w4-2',
  name: 'Ice Slides',
  worldId: 4,
  theme: 'snow',
  width: 150,
  height: LEVEL_HEIGHT,
  spawn: { x: 3, y: ON_GROUND },
  goal: { x: 146, y: ON_GROUND },
  parTimeMs: 80_000,
  solids: [
    ground(0, 10),
    iceGround(10, 20),
    iceGround(35, 15),
    ground(54, 10),
    icePlatform(66, 12, 6),
    icePlatform(75, 11, 6),
    icePlatform(84, 12, 6),
    ground(93, 17),
    iceGround(110, 20),
    ground(134, 16),
  ],
  boostPads: [
    { id: 'w4-2-boost-1', x: 12, y: ON_GROUND, width: 2, direction: 1 },
    { id: 'w4-2-boost-2', x: 76, y: 10, width: 1, direction: 1 },
    { id: 'w4-2-boost-3', x: 112, y: ON_GROUND, width: 2, direction: 1 },
  ],
  collectibles: [
    ...coins('start', 4, ON_GROUND, 4),
    ...coins('slide-1', 16, ON_GROUND, 12),
    ...coins('slide-2', 36, ON_GROUND, 8),
    ...coins('rest', 56, ON_GROUND, 6),
    ...coins('steps', 67, 11, 4),
    ...coins('steps-2', 85, 11, 4),
    ...coins('run', 95, ON_GROUND, 10),
    ...coins('slide-3', 116, ON_GROUND, 12),
    ...coins('finish', 136, ON_GROUND, 6),
    brick('w4-2-brick-a', 32, 10),
    brick('w4-2-brick-b', 78, 8),
    brick('w4-2-brick-c', 132, 10),
  ],
  checkpoints: [
    { id: 'w4-2-cp-1', x: 56, y: ON_GROUND },
    { id: 'w4-2-cp-2', x: 94, y: ON_GROUND },
    { id: 'w4-2-cp-3', x: 135, y: ON_GROUND },
  ],
  hazards: [{ id: 'w4-2-spikes', kind: 'spikes', x: 46, y: ON_GROUND, width: 2 }],
  enemies: [{ id: 'w4-2-walker-1', kind: 'walker', x: 101, y: ON_GROUND, patrolMinX: 96, patrolMaxX: 108 }],
  powerUps: [],
  movingPlatforms: [],
  decorations: [sign(5, 'Blue pads launch you. Jump near the edge!'), sign(57, 'Catch your breath')],
};
