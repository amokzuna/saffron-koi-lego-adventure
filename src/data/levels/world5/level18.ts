import type { LevelDefinition } from '../../../game/levels/types';
import { LEVEL_HEIGHT, ON_GROUND, brick, coins, ground, lavaBasin, platform, sign } from '../helpers';

const field1 = lavaBasin('w5-2-lava-1', 14, 46);
const field2 = lavaBasin('w5-2-lava-2', 74, 36);

/**
 * 18 — Lava Bridges: timed platforms that blink before vanishing (with a solid rest stop mid-way), then
 * precise hops between small stones, one of which carries a flame jet.
 */
export const LEVEL_18: LevelDefinition = {
  id: 'w5-2',
  name: 'Lava Bridges',
  worldId: 5,
  theme: 'volcano',
  width: 140,
  height: LEVEL_HEIGHT,
  spawn: { x: 3, y: ON_GROUND },
  goal: { x: 136, y: ON_GROUND },
  parTimeMs: 110_000,
  solids: [
    ground(0, 14),
    field1.solid,
    platform(36, 11, 3),
    ground(60, 14),
    field2.solid,
    platform(78, 12, 2),
    platform(83, 11, 2),
    platform(88, 12, 2),
    platform(93, 11, 2),
    platform(98, 12, 2),
    platform(103, 11, 3),
    ground(110, 30),
  ],
  hazards: [field1.lava, field2.lava],
  timedPlatforms: [
    { id: 'w5-2-t1', x: 16, y: 12, width: 3, periodMs: 4000, visibleMs: 2800 },
    { id: 'w5-2-t2', x: 21, y: 12, width: 3, periodMs: 4000, visibleMs: 2800, phaseMs: 1000 },
    { id: 'w5-2-t3', x: 26, y: 11, width: 3, periodMs: 4000, visibleMs: 2800, phaseMs: 2000 },
    { id: 'w5-2-t4', x: 31, y: 12, width: 3, periodMs: 4000, visibleMs: 2800, phaseMs: 3000 },
    { id: 'w5-2-t5', x: 41, y: 12, width: 3, periodMs: 3800, visibleMs: 2600 },
    { id: 'w5-2-t6', x: 46, y: 11, width: 3, periodMs: 3800, visibleMs: 2600, phaseMs: 1300 },
    { id: 'w5-2-t7', x: 51, y: 12, width: 3, periodMs: 3800, visibleMs: 2600, phaseMs: 2600 },
    { id: 'w5-2-t8', x: 56, y: 12, width: 3, periodMs: 3800, visibleMs: 2600 },
  ],
  flameJets: [{ id: 'w5-2-jet', x: 93, y: 10, height: 3, periodMs: 3000, activeMs: 900, warningMs: 800 }],
  collectibles: [
    ...coins('start', 4, ON_GROUND, 4),
    ...coins('timed-1', 17, 11, 6),
    ...coins('rest', 36, 10, 3),
    ...coins('timed-2', 42, 10, 6),
    ...coins('ground', 62, ON_GROUND, 8),
    ...coins('stones', 78, 11, 2),
    ...coins('stones-2', 88, 11, 2),
    ...coins('stones-3', 98, 11, 2),
    ...coins('finish', 112, ON_GROUND, 12),
    brick('w5-2-brick-a', 37, 9),
    brick('w5-2-brick-b', 88, 9),
    brick('w5-2-brick-c', 128, 10),
  ],
  checkpoints: [
    { id: 'w5-2-cp-1', x: 62, y: ON_GROUND },
    { id: 'w5-2-cp-2', x: 111, y: ON_GROUND },
  ],
  enemies: [{ id: 'w5-2-walker-1', kind: 'walker', x: 120, y: ON_GROUND, patrolMinX: 114, patrolMaxX: 128 }],
  powerUps: [{ id: 'w5-2-heart', kind: 'extraHeart', x: 64, y: ON_GROUND }],
  movingPlatforms: [],
  decorations: [sign(5, 'Purple bricks blink before they vanish'), sign(66, 'Precise hops ahead')],
};
