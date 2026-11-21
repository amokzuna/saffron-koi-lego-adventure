import type { LevelDefinition } from '../../../game/levels/types';
import { LEVEL_HEIGHT, ON_GROUND, brick, coins, deco, ground, sign } from '../helpers';

/**
 * 11 — Desert Storm: periodic wind gusts, always announced by sand streaks. The first gust zone is over
 * flat ground; later ones blow across a ferry and sinking sand. Holding against the wind resists it.
 */
export const LEVEL_11: LevelDefinition = {
  id: 'w3-3',
  name: 'Desert Storm',
  worldId: 3,
  theme: 'desert',
  width: 150,
  height: LEVEL_HEIGHT,
  spawn: { x: 3, y: ON_GROUND },
  goal: { x: 146, y: ON_GROUND },
  parTimeMs: 100_000,
  solids: [ground(0, 24), ground(28, 22), ground(54, 16), ground(84, 20), ground(116, 34)],
  movingPlatforms: [{ id: 'w3-3-ferry', x: 70, y: 13, width: 3, dx: 11, dy: 0, periodMs: 6000 }],
  sinkingPlatforms: [
    { id: 'w3-3-sand-1', x: 106, y: 12, width: 3, maxDrop: 3 },
    { id: 'w3-3-sand-2', x: 111, y: 11, width: 3, maxDrop: 3 },
  ],
  windZones: [
    { id: 'w3-3-wind-1', x: 10, width: 14, force: -160, periodMs: 5000, activeMs: 1500, warningMs: 1000 },
    { id: 'w3-3-wind-2', x: 36, width: 14, force: 180, periodMs: 6000, activeMs: 1500, warningMs: 1000 },
    { id: 'w3-3-wind-3', x: 70, width: 14, force: -140, periodMs: 5500, activeMs: 1400, warningMs: 1000 },
    { id: 'w3-3-wind-4', x: 104, width: 12, force: 150, periodMs: 5000, activeMs: 1300, warningMs: 1000, phaseMs: 2500 },
  ],
  collectibles: [
    ...coins('start', 4, ON_GROUND, 4),
    ...coins('gust-1', 12, ON_GROUND, 8),
    ...coins('tail', 30, ON_GROUND, 8),
    ...coins('ledge', 56, ON_GROUND, 8),
    ...coins('ferry', 72, 11, 8),
    ...coins('mid', 86, ON_GROUND, 6),
    ...coins('sand', 106, 11, 3),
    ...coins('sand-2', 111, 10, 3),
    ...coins('finish', 122, ON_GROUND, 10),
    brick('w3-3-brick-a', 14, 10),
    brick('w3-3-brick-b', 77, 10),
    brick('w3-3-brick-c', 112, 8),
  ],
  checkpoints: [
    { id: 'w3-3-cp-1', x: 29, y: ON_GROUND },
    { id: 'w3-3-cp-2', x: 56, y: ON_GROUND },
    { id: 'w3-3-cp-3', x: 86, y: ON_GROUND },
    { id: 'w3-3-cp-4', x: 117, y: ON_GROUND },
  ],
  hazards: [],
  enemies: [
    { id: 'w3-3-walker-1', kind: 'walker', x: 94, y: ON_GROUND, patrolMinX: 88, patrolMaxX: 100 },
    { id: 'w3-3-flyer-1', kind: 'flyer', x: 128, y: 11, patrolMinX: 122, patrolMaxX: 134 },
  ],
  powerUps: [{ id: 'w3-3-shield', kind: 'shield', x: 120, y: ON_GROUND }],
  decorations: [
    sign(6, 'Sand streaks mean a gust is coming. Hold against it!'),
    deco('bush', 26),
    deco('bush', 60),
    deco('flower', 90),
    deco('bush', 140),
  ],
};
