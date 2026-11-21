import type { LevelDefinition } from '../../../game/levels/types';
import { LEVEL_HEIGHT, ON_GROUND, brick, coins, ground, lavaBasin, platform, sign } from '../helpers';

const a = lavaBasin('w5-3-lava-a', 12, 12);
const b = lavaBasin('w5-3-lava-b', 40, 36);
const c1 = lavaBasin('w5-3-lava-c1', 98, 6);
const c2 = lavaBasin('w5-3-lava-c2', 114, 8);

/**
 * 19 — Volcano Challenge: the final skill test. Combines crumbling planks, flame jets, a ferry, a spiked
 * ball, timed platforms, a lift, enemies, and lava, with a checkpoint before every demanding section.
 */
export const LEVEL_19: LevelDefinition = {
  id: 'w5-3',
  name: 'Volcano Challenge',
  worldId: 5,
  theme: 'volcano',
  width: 170,
  height: LEVEL_HEIGHT,
  spawn: { x: 3, y: ON_GROUND },
  goal: { x: 166, y: ON_GROUND },
  parTimeMs: 150_000,
  solids: [
    ground(0, 12),
    a.solid,
    ground(24, 16),
    b.solid,
    platform(55, 11, 3),
    ground(76, 22),
    c1.solid,
    ground(104, 10, 9), // high ledge reached by the lift
    c2.solid,
    ground(122, 48),
  ],
  hazards: [a.lava, b.lava, c1.lava, c2.lava],
  crumbling: [
    { id: 'w5-3-crumble-a', x: 13, y: 12, width: 10 },
    { id: 'w5-3-crumble-c', x: 115, y: 11, width: 7 },
  ],
  movingPlatforms: [
    { id: 'w5-3-ferry', x: 41, y: 12, width: 3, dx: 8, dy: 0, periodMs: 5000 },
    { id: 'w5-3-lift', x: 99, y: 13, width: 2, dx: 0, dy: -4, periodMs: 4400 },
  ],
  movingHazards: [
    { id: 'w5-3-ball-1', kind: 'spikeBall', x: 57, y: 6, dx: 0, dy: 4, periodMs: 2600 },
    { id: 'w5-3-ball-2', kind: 'spikeBall', x: 128, y: 12, dx: 6, dy: 0, periodMs: 3600 },
  ],
  timedPlatforms: [
    { id: 'w5-3-t1', x: 61, y: 12, width: 3, periodMs: 4200, visibleMs: 3000 },
    { id: 'w5-3-t2', x: 66, y: 11, width: 3, periodMs: 4200, visibleMs: 3000, phaseMs: 1500 },
    { id: 'w5-3-t3', x: 71, y: 12, width: 3, periodMs: 4200, visibleMs: 3000, phaseMs: 3000 },
  ],
  flameJets: [
    { id: 'w5-3-jet-1', x: 30, y: ON_GROUND, height: 4, periodMs: 3000, activeMs: 1000, warningMs: 700 },
    { id: 'w5-3-jet-2', x: 35, y: ON_GROUND, height: 4, periodMs: 3000, activeMs: 1000, warningMs: 700, phaseMs: 1500 },
    { id: 'w5-3-jet-3', x: 109, y: 8, height: 3, periodMs: 3200, activeMs: 900, warningMs: 800 },
    { id: 'w5-3-jet-4', x: 152, y: ON_GROUND, height: 4, periodMs: 3000, activeMs: 1000, warningMs: 700 },
  ],
  collectibles: [
    ...coins('start', 4, ON_GROUND, 4),
    ...coins('planks', 14, 11, 8),
    ...coins('jets', 26, ON_GROUND, 3),
    ...coins('ferry', 43, 10, 8),
    ...coins('timed', 62, 10, 10),
    ...coins('mid', 79, ON_GROUND, 10),
    ...coins('ledge', 105, 8, 3),
    ...coins('planks-2', 116, 10, 5),
    ...coins('final', 124, ON_GROUND, 3),
    ...coins('final-2', 136, ON_GROUND, 12),
    brick('w5-3-brick-a', 18, 9),
    brick('w5-3-brick-b', 67, 8),
    brick('w5-3-brick-c', 111, 5),
  ],
  checkpoints: [
    { id: 'w5-3-cp-1', x: 25, y: ON_GROUND },
    { id: 'w5-3-cp-2', x: 77, y: ON_GROUND },
    { id: 'w5-3-cp-3', x: 123, y: ON_GROUND },
  ],
  enemies: [
    { id: 'w5-3-hopper-1', kind: 'hopper', x: 86, y: ON_GROUND, patrolMinX: 80, patrolMaxX: 94 },
    { id: 'w5-3-flyer-1', kind: 'flyer', x: 90, y: 11, patrolMinX: 80, patrolMaxX: 96 },
    { id: 'w5-3-walker-1', kind: 'walker', x: 142, y: ON_GROUND, patrolMinX: 136, patrolMaxX: 150 },
  ],
  powerUps: [{ id: 'w5-3-heart', kind: 'extraHeart', x: 125, y: ON_GROUND }],
  decorations: [sign(5, 'Everything you have learned — good luck!'), sign(97, 'Ride the lift ↑')],
};
