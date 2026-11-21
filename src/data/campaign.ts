import { LEVEL_1 } from './levels/world1/level1';
import { LEVEL_2 } from './levels/world1/level2';
import { LEVEL_3 } from './levels/world1/level3';
import { LEVEL_4 } from './levels/world1/level4';
import { LEVEL_5 } from './levels/world2/level5';
import { LEVEL_6 } from './levels/world2/level6';
import { LEVEL_7 } from './levels/world2/level7';
import { LEVEL_8 } from './levels/world2/level8';
import { LEVEL_9 } from './levels/world3/level9';
import { LEVEL_10 } from './levels/world3/level10';
import { LEVEL_11 } from './levels/world3/level11';
import { LEVEL_12 } from './levels/world3/level12';
import { LEVEL_13 } from './levels/world4/level13';
import { LEVEL_14 } from './levels/world4/level14';
import { LEVEL_15 } from './levels/world4/level15';
import { LEVEL_16 } from './levels/world4/level16';
import { LEVEL_17 } from './levels/world5/level17';
import { LEVEL_18 } from './levels/world5/level18';
import { LEVEL_19 } from './levels/world5/level19';
import { LEVEL_20 } from './levels/world5/level20';
import type { LevelDefinition } from '../game/levels/types';

export interface WorldDefinition {
  id: number;
  name: string;
  /** Campaign levels in play order. Empty for worlds not built yet. */
  levels: LevelDefinition[];
  /** Planned level count, shown for worlds that are not available yet. */
  plannedLevels: number;
  accent: string;
}

/** The campaign: five worlds of four levels. Only built levels are listed; see docs/LEVEL_DESIGN.md. */
export const WORLDS: readonly WorldDefinition[] = [
  { id: 1, name: 'Green Grassland', levels: [LEVEL_1, LEVEL_2, LEVEL_3, LEVEL_4], plannedLevels: 4, accent: '#3fa34d' },
  { id: 2, name: 'Mushroom Forest', levels: [LEVEL_5, LEVEL_6, LEVEL_7, LEVEL_8], plannedLevels: 4, accent: '#7b3fa0' },
  { id: 3, name: 'Desert Kingdom', levels: [LEVEL_9, LEVEL_10, LEVEL_11, LEVEL_12], plannedLevels: 4, accent: '#e0a83a' },
  { id: 4, name: 'Frozen Kingdom', levels: [LEVEL_13, LEVEL_14, LEVEL_15, LEVEL_16], plannedLevels: 4, accent: '#5fb3e6' },
  { id: 5, name: 'Lava Volcano', levels: [LEVEL_17, LEVEL_18, LEVEL_19, LEVEL_20], plannedLevels: 4, accent: '#d9482f' },
];

/** All playable campaign levels in unlock order. */
export const CAMPAIGN_LEVELS: readonly LevelDefinition[] = WORLDS.flatMap((w) => w.levels);
export const CAMPAIGN_LEVEL_IDS: readonly string[] = CAMPAIGN_LEVELS.map((l) => l.id);

/** 1-based level number across the campaign (e.g. "Level 3"), or null for non-campaign levels. */
export function campaignNumber(levelId: string): number | null {
  const index = CAMPAIGN_LEVEL_IDS.indexOf(levelId);
  return index === -1 ? null : index + 1;
}

export function nextCampaignLevelId(levelId: string): string | null {
  const index = CAMPAIGN_LEVEL_IDS.indexOf(levelId);
  return index === -1 ? null : (CAMPAIGN_LEVEL_IDS[index + 1] ?? null);
}
