import type { LevelDefinition } from '../../../game/levels/types';
import { LEVEL_HEIGHT, ON_GROUND, brick, coins, deco, glow, ground, platform, sign } from '../helpers';

/**
 * 7 — The Dark Cave: a navigation challenge in low light. The hero carries a wide light, glow mushrooms
 * mark the route and every hazard, and enemies glow faintly. No hazard sits under a low ceiling.
 */
export const LEVEL_7: LevelDefinition = {
  id: 'w2-3',
  name: 'The Dark Cave',
  worldId: 2,
  theme: 'cave',
  width: 130,
  height: LEVEL_HEIGHT,
  spawn: { x: 3, y: ON_GROUND },
  goal: { x: 126, y: ON_GROUND },
  parTimeMs: 100_000,
  darkness: { ambientAlpha: 0.86, playerLightRadius: 190 },
  solids: [
    { x: 0, y: 0, width: 130, height: 2, style: 'ground' }, // cave ceiling
    ground(0, 20),
    ground(23, 15),
    { x: 30, y: 2, width: 6, height: 8, style: 'ground' }, // hanging rock: low passage
    ground(38, 6, 11),
    ground(44, 10),
    ground(58, 6),
    ground(64, 10, 8), // high ledge, reached by the lift
    ground(74, 16),
    platform(85, 11, 3),
    ground(94, 12),
    { x: 98, y: 2, width: 5, height: 9, style: 'ground' }, // second low passage
    ground(106, 24),
  ],
  movingPlatforms: [{ id: 'w2-3-lift', x: 61, y: 13, width: 2, dx: 0, dy: -5, periodMs: 4600 }],
  collectibles: [
    ...coins('start', 6, ON_GROUND, 4),
    ...coins('tunnel', 30, ON_GROUND, 6),
    ...coins('step', 39, 10, 4),
    ...coins('ledge', 66, 7, 6),
    ...coins('drop', 76, ON_GROUND, 5),
    ...coins('passage', 98, ON_GROUND, 5),
    ...coins('finish', 110, ON_GROUND, 6),
    brick('w2-3-brick-a', 41, 10),
    brick('w2-3-brick-b', 72, 5),
    brick('w2-3-brick-c', 86, 9),
  ],
  checkpoints: [
    { id: 'w2-3-cp-1', x: 25, y: ON_GROUND },
    { id: 'w2-3-cp-2', x: 59, y: ON_GROUND },
    { id: 'w2-3-cp-3', x: 76, y: ON_GROUND },
    { id: 'w2-3-cp-4', x: 95, y: ON_GROUND },
  ],
  hazards: [
    { id: 'w2-3-spikes-1', kind: 'spikes', x: 47, y: ON_GROUND, width: 2 },
    { id: 'w2-3-spikes-2', kind: 'spikes', x: 104, y: ON_GROUND, width: 2 },
  ],
  enemies: [
    { id: 'w2-3-hopper-1', kind: 'hopper', x: 69, y: 7, patrolMinX: 66, patrolMaxX: 73 },
    { id: 'w2-3-flyer-1', kind: 'flyer', x: 82, y: 11, patrolMinX: 77, patrolMaxX: 89 },
    { id: 'w2-3-hopper-2', kind: 'hopper', x: 114, y: ON_GROUND, patrolMinX: 109, patrolMaxX: 119 },
  ],
  powerUps: [{ id: 'w2-3-heart', kind: 'extraHeart', x: 75, y: ON_GROUND }],
  decorations: [
    sign(5, 'Follow the glowing mushrooms'),
    glow(10),
    glow(17),
    glow(22),
    glow(28),
    glow(37),
    glow(45),
    glow(52),
    glow(57),
    glow(63, 13),
    glow(67, 7),
    glow(73, 7),
    glow(80),
    glow(88),
    glow(93),
    glow(102),
    glow(108),
    glow(118),
    glow(123),
    deco('mushroom', 34),
  ],
};
