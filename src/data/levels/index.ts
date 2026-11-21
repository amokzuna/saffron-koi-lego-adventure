import type { LevelDefinition } from '../../game/levels/types';
import { CAMPAIGN_LEVELS } from '../campaign';
import { SANDBOX_LEVEL } from './sandboxLevel';
import { TEST_LEVEL } from './testLevel';

/** Developer-only levels, reachable with `?level=<id>` but not part of the campaign. */
export const DEV_LEVELS: readonly LevelDefinition[] = [TEST_LEVEL, SANDBOX_LEVEL];

export const LEVELS: Readonly<Record<string, LevelDefinition>> = Object.fromEntries(
  [...CAMPAIGN_LEVELS, ...DEV_LEVELS].map((level) => [level.id, level]),
);

export const DEFAULT_LEVEL_ID = CAMPAIGN_LEVELS[0]!.id;

export function findLevel(id: string | null | undefined): LevelDefinition | undefined {
  return id && Object.hasOwn(LEVELS, id) ? LEVELS[id] : undefined;
}

/** Looks up a level by id, falling back to the default level for unknown or missing ids. */
export function resolveLevel(id: string | null | undefined): LevelDefinition {
  return findLevel(id) ?? LEVELS[DEFAULT_LEVEL_ID]!;
}
