import type { LevelDefinition } from '../../game/levels/types';

/**
 * Developer sandbox (open with `?level=sandbox`). A short, flat, deterministic level with
 * one of each Milestone 2 system, used by the Playwright smoke tests:
 * - walking left from spawn drops into a pit (tests falls and game over)
 * - walking right meets a checkpoint, spikes, a walker, an extra heart, a brick, and the goal
 */
const GROUND_TOP = 14;

export const SANDBOX_LEVEL: LevelDefinition = {
  id: 'sandbox',
  name: 'Systems Sandbox',
  worldId: 0,
  theme: 'grassland',
  width: 44,
  height: 17,
  spawn: { x: 4, y: GROUND_TOP - 1 },
  goal: { x: 38, y: GROUND_TOP - 1 },
  parTimeMs: 60_000,
  solids: [{ x: 2, y: GROUND_TOP, width: 42, height: 3, style: 'ground' }],
  collectibles: [
    { id: 'coin-0', kind: 'coin', x: 6, y: GROUND_TOP - 1 },
    { id: 'brick-0', kind: 'brick', x: 34, y: GROUND_TOP - 1 },
  ],
  checkpoints: [{ id: 'cp-sandbox', x: 8, y: GROUND_TOP - 1 }],
  hazards: [{ id: 'spikes-sandbox', kind: 'spikes', x: 12, y: GROUND_TOP - 1, width: 2 }],
  enemies: [{ id: 'walker-sandbox', kind: 'walker', x: 25, y: GROUND_TOP - 1, patrolMinX: 22, patrolMaxX: 28 }],
  powerUps: [{ id: 'pu-heart-sandbox', kind: 'extraHeart', x: 31, y: GROUND_TOP - 1 }],
  movingPlatforms: [],
  decorations: [],
};
