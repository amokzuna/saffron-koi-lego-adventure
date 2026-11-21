import type { LevelDefinition } from '../../../game/levels/types';
import { LEVEL_HEIGHT, ON_GROUND, brick, coins, ground, iceGround, sign } from '../helpers';

/**
 * 15 — Frozen Castle: combines moving platforms, crumbling planks, a spiked ball, ice, enemies, and
 * icicles (introduced on safe ground first: they shake before falling).
 */
export const LEVEL_15: LevelDefinition = {
  id: 'w4-3',
  name: 'Frozen Castle',
  worldId: 4,
  theme: 'castle',
  width: 150,
  height: LEVEL_HEIGHT,
  spawn: { x: 3, y: ON_GROUND },
  goal: { x: 146, y: ON_GROUND },
  parTimeMs: 110_000,
  solids: [
    { x: 0, y: 0, width: 150, height: 2, style: 'ground' }, // ceiling
    ground(0, 24),
    ground(30, 20),
    iceGround(50, 14),
    ground(72, 26),
    ground(108, 42),
  ],
  movingPlatforms: [
    { id: 'w4-3-ferry-1', x: 24, y: 13, width: 3, dx: 3, dy: 0, periodMs: 3600 },
    { id: 'w4-3-ferry-2', x: 99, y: 12, width: 3, dx: 6, dy: 0, periodMs: 4200 },
  ],
  crumbling: [{ id: 'w4-3-crumble', x: 64, y: 14, width: 8 }],
  movingHazards: [{ id: 'w4-3-ball', kind: 'spikeBall', x: 38, y: 8, dx: 0, dy: 5, periodMs: 2800 }],
  icicles: [
    { id: 'w4-3-icicle-1', x: 12, y: 2 },
    { id: 'w4-3-icicle-2', x: 18, y: 2 },
    { id: 'w4-3-icicle-3', x: 80, y: 2 },
    { id: 'w4-3-icicle-4', x: 86, y: 2 },
    { id: 'w4-3-icicle-5', x: 92, y: 2 },
    { id: 'w4-3-icicle-6', x: 134, y: 2 },
  ],
  collectibles: [
    ...coins('start', 4, ON_GROUND, 4),
    ...coins('icicles', 11, ON_GROUND, 9),
    ...coins('ferry', 25, 11, 4),
    ...coins('hall', 32, ON_GROUND, 4),
    ...coins('hall-2', 42, ON_GROUND, 6),
    ...coins('ice', 52, ON_GROUND, 10),
    ...coins('planks', 65, 12, 6),
    ...coins('gallery', 75, ON_GROUND, 20),
    ...coins('ferry-2', 100, 10, 6),
    ...coins('finish', 112, ON_GROUND, 12),
    brick('w4-3-brick-a', 27, 9),
    brick('w4-3-brick-b', 60, 10),
    brick('w4-3-brick-c', 103, 8),
  ],
  checkpoints: [
    { id: 'w4-3-cp-1', x: 31, y: ON_GROUND },
    { id: 'w4-3-cp-2', x: 74, y: ON_GROUND },
    { id: 'w4-3-cp-3', x: 110, y: ON_GROUND },
  ],
  hazards: [{ id: 'w4-3-spikes', kind: 'spikes', x: 126, y: ON_GROUND, width: 2 }],
  enemies: [
    { id: 'w4-3-walker-1', kind: 'walker', x: 57, y: ON_GROUND, patrolMinX: 52, patrolMaxX: 62 },
    { id: 'w4-3-hopper-1', kind: 'hopper', x: 90, y: ON_GROUND, patrolMinX: 84, patrolMaxX: 96 },
    { id: 'w4-3-flyer-1', kind: 'flyer', x: 120, y: 11, patrolMinX: 112, patrolMaxX: 130 },
  ],
  powerUps: [{ id: 'w4-3-heart', kind: 'extraHeart', x: 111, y: ON_GROUND }],
  decorations: [sign(5, 'Icicles shake, then fall. Keep moving!'), sign(46, 'Slippery floor ahead')],
};
