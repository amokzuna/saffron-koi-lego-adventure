import type { LevelDefinition } from '../../../game/levels/types';
import { LEVEL_HEIGHT, ON_GROUND, brick, coins, ground, platform, sign } from '../helpers';

/**
 * 10 — Ancient Pyramid: interior routes. A switch on a ledge opens the first door; the second door's
 * switch is on the upper floor, so the upper route is required. A false wall hides a brick alcove.
 */
export const LEVEL_10: LevelDefinition = {
  id: 'w3-2',
  name: 'Ancient Pyramid',
  worldId: 3,
  theme: 'pyramid',
  width: 120,
  height: LEVEL_HEIGHT,
  spawn: { x: 3, y: ON_GROUND },
  goal: { x: 116, y: ON_GROUND },
  parTimeMs: 110_000,
  solids: [
    { x: 0, y: 0, width: 120, height: 2, style: 'ground' }, // ceiling
    ground(0, 30),
    ground(34, 86),
    platform(10, 10, 4),
    platform(36, 11, 2),
    { x: 40, y: 9, width: 16, height: 1, style: 'ground' }, // upper floor
    { x: 78, y: 2, width: 3, height: 9, style: 'ground' }, // hanging pillar, passage beneath
    platform(88, 11, 2),
    platform(91, 8, 8),
    { x: 99, y: 2, width: 2, height: 7, style: 'ground' }, // back wall of the hidden alcove
  ],
  switches: [
    { id: 'w3-2-switch-1', x: 12, y: 9 },
    { id: 'w3-2-switch-2', x: 53, y: 8 },
  ],
  doors: [
    { id: 'w3-2-door-1', switchId: 'w3-2-switch-1', x: 24, y: 2, width: 1, height: 12 },
    { id: 'w3-2-door-2', switchId: 'w3-2-switch-2', x: 60, y: 2, width: 1, height: 12 },
  ],
  secrets: [{ x: 94, y: 3, width: 5, height: 5 }],
  collectibles: [
    ...coins('start', 4, ON_GROUND, 4),
    ...coins('ledge', 10, 9, 2),
    ...coins('hall', 26, ON_GROUND, 3),
    ...coins('upper', 41, 8, 10),
    ...coins('lower', 42, ON_GROUND, 6),
    ...coins('gallery', 63, ON_GROUND, 12),
    ...coins('steps', 88, 10, 2),
    ...coins('alcove', 94, 7, 2),
    ...coins('final', 104, ON_GROUND, 8),
    brick('w3-2-brick-a', 13, 7),
    brick('w3-2-brick-b', 47, 8),
    brick('w3-2-brick-c', 97, 7),
  ],
  checkpoints: [
    { id: 'w3-2-cp-1', x: 35, y: ON_GROUND },
    { id: 'w3-2-cp-2', x: 62, y: ON_GROUND },
    { id: 'w3-2-cp-3', x: 102, y: ON_GROUND },
  ],
  hazards: [{ id: 'w3-2-spikes', kind: 'spikes', x: 106, y: ON_GROUND, width: 2 }],
  enemies: [
    { id: 'w3-2-walker-1', kind: 'walker', x: 49, y: ON_GROUND, patrolMinX: 45, patrolMaxX: 55 },
    { id: 'w3-2-hopper-1', kind: 'hopper', x: 68, y: ON_GROUND, patrolMinX: 63, patrolMaxX: 74 },
  ],
  powerUps: [{ id: 'w3-2-heart', kind: 'extraHeart', x: 84, y: ON_GROUND }],
  movingPlatforms: [],
  decorations: [
    sign(5, 'Step on switches to open doors'),
    sign(38, 'Some doors need the high road'),
    sign(86, 'Not every wall is solid…'),
  ],
};
