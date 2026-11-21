import type { LevelDefinition } from '../../../game/levels/types';
import { LEVEL_HEIGHT, ON_GROUND, brick, coins, deco, ground, sign } from '../helpers';

/**
 * 9 — Sandy Adventure: sinking sand. The first sand platform sits safely over solid ground; later ones
 * bridge pits, so the lesson (keep moving) is learned before it matters.
 */
export const LEVEL_9: LevelDefinition = {
  id: 'w3-1',
  name: 'Sandy Adventure',
  worldId: 3,
  theme: 'desert',
  width: 140,
  height: LEVEL_HEIGHT,
  spawn: { x: 3, y: ON_GROUND },
  goal: { x: 136, y: ON_GROUND },
  parTimeMs: 90_000,
  solids: [ground(0, 20), ground(34, 16), ground(50, 10, 12), ground(60, 8, 10), ground(80, 20), ground(106, 34)],
  sinkingPlatforms: [
    { id: 'w3-1-sand-demo', x: 8, y: 11, width: 4, maxDrop: 2 },
    { id: 'w3-1-sand-1', x: 22, y: 12, width: 3, maxDrop: 3 },
    { id: 'w3-1-sand-2', x: 28, y: 11, width: 3, maxDrop: 3 },
    { id: 'w3-1-sand-3', x: 70, y: 10, width: 3, maxDrop: 4 },
    { id: 'w3-1-sand-4', x: 75, y: 11, width: 3, maxDrop: 4 },
    { id: 'w3-1-sand-5', x: 102, y: 13, width: 2, maxDrop: 3 },
  ],
  collectibles: [
    ...coins('start', 4, ON_GROUND, 3),
    ...coins('demo', 8, 10, 4),
    ...coins('sand-1', 22, 11, 3),
    ...coins('sand-2', 28, 10, 3),
    ...coins('flat', 36, ON_GROUND, 6),
    ...coins('dune', 51, 11, 6),
    ...coins('dune-top', 61, 9, 6),
    ...coins('sand-3', 70, 9, 3),
    ...coins('sand-4', 75, 10, 3),
    ...coins('valley', 82, ON_GROUND, 5),
    ...coins('finish', 110, ON_GROUND, 8),
    brick('w3-1-brick-a', 9, 8),
    brick('w3-1-brick-b', 64, 6),
    brick('w3-1-brick-c', 76, 8),
  ],
  checkpoints: [
    { id: 'w3-1-cp-1', x: 35, y: ON_GROUND },
    { id: 'w3-1-cp-2', x: 82, y: ON_GROUND },
    { id: 'w3-1-cp-3', x: 107, y: ON_GROUND },
  ],
  hazards: [{ id: 'w3-1-spikes', kind: 'spikes', x: 97, y: ON_GROUND, width: 2 }],
  enemies: [
    { id: 'w3-1-walker-1', kind: 'walker', x: 42, y: ON_GROUND, patrolMinX: 37, patrolMaxX: 48 },
    { id: 'w3-1-hopper-1', kind: 'hopper', x: 90, y: ON_GROUND, patrolMinX: 85, patrolMaxX: 95 },
    { id: 'w3-1-flyer-1', kind: 'flyer', x: 116, y: 11, patrolMinX: 108, patrolMaxX: 124 },
  ],
  powerUps: [{ id: 'w3-1-super-jump', kind: 'superJump', x: 109, y: ON_GROUND }],
  movingPlatforms: [],
  decorations: [sign(5, 'Sand sinks while you stand on it. Keep moving!'), deco('bush', 16), deco('flower', 46), deco('bush', 88), deco('bush', 130)],
};
