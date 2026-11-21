import type { LevelDefinition } from '../../../game/levels/types';
import { LEVEL_HEIGHT, ON_GROUND, brick, coins, ground, platform, sign } from '../helpers';

/**
 * 12 — Pyramid Sentinel: a short warm-up, then the Sentinel's arena (open above so boulders can fall).
 * Boulders always land on red markers shown beforehand; after its drops the Sentinel slams down and is stunned.
 */
export const LEVEL_12: LevelDefinition = {
  id: 'w3-4',
  name: 'Pyramid Sentinel',
  worldId: 3,
  theme: 'pyramid',
  width: 80,
  height: LEVEL_HEIGHT,
  spawn: { x: 3, y: ON_GROUND },
  goal: { x: 61, y: ON_GROUND },
  parTimeMs: 130_000,
  solids: [ground(0, 30), ground(33, 47), platform(13, 10, 4)],
  collectibles: [
    ...coins('start', 5, ON_GROUND, 4),
    ...coins('warmup', 13, 9, 4),
    ...coins('approach', 34, ON_GROUND, 5),
    brick('w3-4-brick-a', 15, 7),
    brick('w3-4-brick-b', 24, 10),
    brick('w3-4-brick-c', 54, 10),
  ],
  checkpoints: [{ id: 'w3-4-cp', x: 40, y: ON_GROUND }],
  hazards: [],
  enemies: [{ id: 'w3-4-walker', kind: 'walker', x: 21, y: ON_GROUND, patrolMinX: 18, patrolMaxX: 27 }],
  powerUps: [{ id: 'w3-4-heart', kind: 'extraHeart', x: 37, y: ON_GROUND }],
  movingPlatforms: [],
  decorations: [sign(42, 'Stay off the red marks. Stomp it when it crashes down!')],
  boss: { kind: 'sentinel', name: 'Pyramid Sentinel', x: 70, y: ON_GROUND, arenaMinX: 44, arenaMaxX: 79, triggerX: 47 },
};
