import type { LevelDefinition } from '../../../game/levels/types';
import { LEVEL_HEIGHT, ON_GROUND, brick, coins, ground, lavaBasin, platform, sign } from '../helpers';

const b1 = lavaBasin('w5-1-lava-1', 20, 8);
const b2 = lavaBasin('w5-1-lava-2', 42, 6);
const b3 = lavaBasin('w5-1-lava-3', 66, 12);
const b4 = lavaBasin('w5-1-lava-4', 98, 6);

/**
 * 17 — Fire Valley: lava pools (touching lava is like falling into a pit) with stepping stones,
 * and flame jets that always puff smoke before firing.
 */
export const LEVEL_17: LevelDefinition = {
  id: 'w5-1',
  name: 'Fire Valley',
  worldId: 5,
  theme: 'volcano',
  width: 140,
  height: LEVEL_HEIGHT,
  spawn: { x: 3, y: ON_GROUND },
  goal: { x: 136, y: ON_GROUND },
  parTimeMs: 100_000,
  solids: [ground(0, 20), b1.solid, platform(23, 12, 2), ground(28, 14), b2.solid, platform(44, 11, 2), ground(48, 18), b3.solid, ground(78, 20), b4.solid, platform(100, 11, 2), ground(104, 36)],
  hazards: [b1.lava, b2.lava, b3.lava, b4.lava, { id: 'w5-1-spikes', kind: 'spikes', x: 126, y: ON_GROUND, width: 2 }],
  movingPlatforms: [{ id: 'w5-1-ferry', x: 66, y: 13, width: 3, dx: 9, dy: 0, periodMs: 4600 }],
  flameJets: [
    { id: 'w5-1-jet-1', x: 34, y: ON_GROUND, height: 4, periodMs: 3000, activeMs: 1000, warningMs: 700 },
    { id: 'w5-1-jet-2', x: 54, y: ON_GROUND, height: 4, periodMs: 3000, activeMs: 1000, warningMs: 700 },
    { id: 'w5-1-jet-3', x: 59, y: ON_GROUND, height: 4, periodMs: 3000, activeMs: 1000, warningMs: 700, phaseMs: 1500 },
    { id: 'w5-1-jet-4', x: 95, y: ON_GROUND, height: 3, periodMs: 3200, activeMs: 1000, warningMs: 800 },
  ],
  collectibles: [
    ...coins('start', 4, ON_GROUND, 4),
    ...coins('stone-1', 23, 11, 2),
    ...coins('jets', 30, ON_GROUND, 3),
    ...coins('stone-2', 44, 10, 2),
    ...coins('jets-2', 49, ON_GROUND, 4),
    ...coins('ferry', 68, 11, 8),
    ...coins('mid', 80, ON_GROUND, 6),
    ...coins('stone-3', 100, 10, 2),
    ...coins('finish', 108, ON_GROUND, 12),
    brick('w5-1-brick-a', 24, 9),
    brick('w5-1-brick-b', 56, 9),
    brick('w5-1-brick-c', 72, 10),
  ],
  checkpoints: [
    { id: 'w5-1-cp-1', x: 30, y: ON_GROUND },
    { id: 'w5-1-cp-2', x: 80, y: ON_GROUND },
    { id: 'w5-1-cp-3', x: 105, y: ON_GROUND },
  ],
  enemies: [
    { id: 'w5-1-walker-1', kind: 'walker', x: 63, y: ON_GROUND, patrolMinX: 61, patrolMaxX: 65 },
    { id: 'w5-1-hopper-1', kind: 'hopper', x: 88, y: ON_GROUND, patrolMinX: 82, patrolMaxX: 93 },
    { id: 'w5-1-flyer-1', kind: 'flyer', x: 115, y: 11, patrolMinX: 108, patrolMaxX: 124 },
  ],
  powerUps: [{ id: 'w5-1-shield', kind: 'shield', x: 106, y: ON_GROUND }],
  decorations: [sign(5, 'Lava is like a pit. Hop the stones!'), sign(31, 'Smoke means fire is coming')],
};
