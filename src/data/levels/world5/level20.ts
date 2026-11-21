import type { LevelDefinition } from '../../../game/levels/types';
import { LEVEL_HEIGHT, ON_GROUND, brick, coins, ground, lavaBasin, platform, sign } from '../helpers';

const basin = lavaBasin('w5-4-lava', 14, 6);

/**
 * 20 — Final Guardian: a short fiery warm-up, then the final arena. Four phases alternate the Guardian's
 * charge and the Protector's leap; boulders with warning markers join in the last two phases.
 */
export const LEVEL_20: LevelDefinition = {
  id: 'w5-4',
  name: 'Final Guardian',
  worldId: 5,
  theme: 'volcano',
  width: 80,
  height: LEVEL_HEIGHT,
  spawn: { x: 3, y: ON_GROUND },
  goal: { x: 61, y: ON_GROUND },
  parTimeMs: 180_000,
  solids: [ground(0, 14), basin.solid, platform(16, 11, 2), ground(20, 10), ground(33, 47)],
  hazards: [basin.lava],
  flameJets: [{ id: 'w5-4-jet', x: 25, y: ON_GROUND, height: 4, periodMs: 3000, activeMs: 1000, warningMs: 800 }],
  collectibles: [
    ...coins('start', 4, ON_GROUND, 4),
    ...coins('stone', 16, 10, 2),
    ...coins('approach', 34, ON_GROUND, 5),
    brick('w5-4-brick-a', 17, 8),
    brick('w5-4-brick-b', 28, 10),
    brick('w5-4-brick-c', 52, 10),
  ],
  checkpoints: [{ id: 'w5-4-cp', x: 40, y: ON_GROUND }],
  enemies: [],
  powerUps: [
    { id: 'w5-4-heart', kind: 'extraHeart', x: 37, y: ON_GROUND },
    { id: 'w5-4-shield', kind: 'shield', x: 38, y: ON_GROUND },
  ],
  movingPlatforms: [],
  decorations: [sign(42, 'The final battle. Watch for its tells!')],
  boss: { kind: 'final', name: 'Final Guardian', x: 72, y: ON_GROUND, arenaMinX: 44, arenaMaxX: 79, triggerX: 47 },
};
