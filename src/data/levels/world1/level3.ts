import type { LevelDefinition } from '../../../game/levels/types';
import { LEVEL_HEIGHT, ON_GROUND, brick, coins, deco, ground, platform, sign } from '../helpers';

/**
 * 3 — Moving Platforms: horizontal ferries over wide pits, a vertical lift, and a platform-to-platform
 * transfer. Platforms ease to a stop at each end, giving clear boarding windows. Checkpoint before each section.
 */
export const LEVEL_3: LevelDefinition = {
  id: 'w1-3',
  name: 'Moving Platforms',
  worldId: 1,
  theme: 'grassland',
  width: 140,
  height: LEVEL_HEIGHT,
  spawn: { x: 3, y: ON_GROUND },
  goal: { x: 135, y: ON_GROUND },
  parTimeMs: 90_000,
  solids: [
    ground(0, 16),
    ground(24, 14),
    ground(48, 12),
    platform(66, 8, 5),
    ground(80, 14, 10), // ledge after the high section
    ground(94, 16),
    ground(118, 22),
    platform(28, 10, 3),
    platform(124, 10, 4),
  ],
  movingPlatforms: [
    // Ferry level with the ground: walk on at the left edge, ride across, step off.
    { id: 'w1-3-ferry-1', x: 16, y: 14, width: 3, dx: 5, dy: 0, periodMs: 5000 },
    // Ferry one row up over a longer pit.
    { id: 'w1-3-ferry-2', x: 38, y: 12, width: 3, dx: 7, dy: 0, periodMs: 5200 },
    // Vertical lift up to the high platform.
    { id: 'w1-3-lift', x: 61, y: 13, width: 3, dx: 0, dy: -5, periodMs: 4400 },
    // High transfer to the ledge.
    { id: 'w1-3-ferry-3', x: 72, y: 8, width: 3, dx: 5, dy: 0, periodMs: 4200, phaseMs: 2100 },
    // Final ferry with a gentle rise.
    { id: 'w1-3-ferry-4', x: 110, y: 12, width: 3, dx: 5, dy: -1, periodMs: 4600 },
  ],
  collectibles: [
    ...coins('start', 6, ON_GROUND, 4),
    ...coins('ferry-1', 17, 12, 6),
    ...coins('island', 28, 9, 3),
    ...coins('ferry-2', 40, 10, 7),
    ...coins('lift', 62, 9, 1),
    ...coins('lift-top', 62, 6, 2),
    ...coins('high', 66, 7, 5),
    ...coins('ferry-3', 74, 6, 5),
    ...coins('ledge', 82, 9, 6),
    ...coins('run', 97, ON_GROUND, 5),
    ...coins('ferry-4', 112, 9, 5),
    ...coins('finish', 124, 9, 4),
    brick('w1-3-brick-a', 20, 10),
    brick('w1-3-brick-b', 68, 5),
    brick('w1-3-brick-c', 115, 7),
  ],
  checkpoints: [
    { id: 'w1-3-cp-1', x: 26, y: ON_GROUND },
    { id: 'w1-3-cp-2', x: 50, y: ON_GROUND },
    { id: 'w1-3-cp-3', x: 82, y: 9 },
    { id: 'w1-3-cp-4', x: 120, y: ON_GROUND },
  ],
  hazards: [{ id: 'w1-3-spikes', kind: 'spikes', x: 104, y: ON_GROUND, width: 2 }],
  enemies: [
    { id: 'w1-3-walker-1', kind: 'walker', x: 55, y: ON_GROUND, patrolMinX: 52, patrolMaxX: 58 },
    { id: 'w1-3-walker-2', kind: 'walker', x: 99, y: ON_GROUND, patrolMinX: 96, patrolMaxX: 102 },
  ],
  powerUps: [{ id: 'w1-3-shield', kind: 'shield', x: 96, y: ON_GROUND }],
  decorations: [
    sign(12, 'Ride the moving platforms!'),
    sign(58, 'Take the lift up ↑'),
    deco('bush', 4),
    deco('flower', 33),
    deco('bush', 49),
    deco('flower', 88, 9),
    deco('bush', 129),
    deco('flower', 133),
  ],
};
