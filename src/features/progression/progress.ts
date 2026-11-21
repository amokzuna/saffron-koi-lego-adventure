import type { LevelResult } from '../../game/bridge/GameBridge';

/**
 * Campaign progress. Unlocks are derived from the campaign order plus completed levels rather
 * than stored, so they can never disagree with the level list (e.g. after levels are added).
 */
export interface LevelRecord {
  completed: true;
  bestStars: number;
  bestTimeMs: number;
  bestCoins: number;
  bestBricks: number;
}

export interface ProgressData {
  version: 1;
  levels: Record<string, LevelRecord>;
}

export const CURRENT_PROGRESS_VERSION = 1;

export const emptyProgress = (): ProgressData => ({ version: 1, levels: {} });

const isCount = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0;

function parseRecord(raw: unknown): LevelRecord | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (r.completed !== true || !isCount(r.bestStars) || !isCount(r.bestTimeMs) || !isCount(r.bestCoins) || !isCount(r.bestBricks)) {
    return null;
  }
  return {
    completed: true,
    bestStars: Math.min(3, Math.floor(r.bestStars)),
    bestTimeMs: r.bestTimeMs,
    bestCoins: Math.floor(r.bestCoins),
    bestBricks: Math.floor(r.bestBricks),
  };
}

/**
 * Migrations from older save versions to the next version. Add an entry when the schema changes,
 * e.g. `1: (v1) => ({ ...v1, version: 2, settings: {} })`.
 */
const MIGRATIONS: Record<number, (data: Record<string, unknown>) => Record<string, unknown>> = {};

/**
 * Parses stored progress. Unknown/corrupt data yields empty progress; individual bad level records
 * are dropped; newer-than-supported versions are not trusted (empty progress) rather than misread.
 */
export function parseProgress(raw: unknown): ProgressData {
  if (typeof raw !== 'object' || raw === null) return emptyProgress();
  let data = raw as Record<string, unknown>;
  let version = data.version;
  while (typeof version === 'number' && version < CURRENT_PROGRESS_VERSION && MIGRATIONS[version]) {
    data = MIGRATIONS[version]!(data);
    version = data.version;
  }
  if (version !== CURRENT_PROGRESS_VERSION || typeof data.levels !== 'object' || data.levels === null) return emptyProgress();

  const levels: Record<string, LevelRecord> = {};
  for (const [id, record] of Object.entries(data.levels as Record<string, unknown>)) {
    const parsed = parseRecord(record);
    if (parsed) levels[id] = parsed;
  }
  return { version: 1, levels };
}

export interface RecordOutcome {
  progress: ProgressData;
  firstCompletion: boolean;
  newBestStars: boolean;
  newBestTime: boolean;
}

/** Merges a completed run into progress, keeping the best value of each stat independently. */
export function recordResult(progress: ProgressData, result: LevelResult): RecordOutcome {
  const previous = progress.levels[result.levelId];
  const record: LevelRecord = {
    completed: true,
    bestStars: Math.max(previous?.bestStars ?? 0, result.rating.stars),
    bestTimeMs: Math.min(previous?.bestTimeMs ?? Infinity, result.elapsedMs),
    bestCoins: Math.max(previous?.bestCoins ?? 0, result.collected.coin),
    bestBricks: Math.max(previous?.bestBricks ?? 0, result.collected.brick),
  };
  return {
    progress: { ...progress, levels: { ...progress.levels, [result.levelId]: record } },
    firstCompletion: !previous,
    newBestStars: !!previous && result.rating.stars > previous.bestStars,
    newBestTime: !!previous && result.elapsedMs < previous.bestTimeMs,
  };
}

export type LevelStatus = 'locked' | 'available' | 'completed';

/** Level 1 is always unlocked; each later level unlocks when the previous one is completed. */
export function levelStatus(progress: ProgressData, campaignIds: readonly string[], levelId: string): LevelStatus {
  if (progress.levels[levelId]?.completed) return 'completed';
  const index = campaignIds.indexOf(levelId);
  if (index === 0) return 'available';
  if (index > 0 && progress.levels[campaignIds[index - 1]!]?.completed) return 'available';
  return 'locked';
}

export function isUnlocked(progress: ProgressData, campaignIds: readonly string[], levelId: string): boolean {
  return levelStatus(progress, campaignIds, levelId) !== 'locked';
}

/** The first unlocked, not-yet-completed level; or the last level if everything is completed. */
export function nextLevelToPlay(progress: ProgressData, campaignIds: readonly string[]): string {
  return campaignIds.find((id) => levelStatus(progress, campaignIds, id) === 'available') ?? campaignIds.at(-1)!;
}

export function totalStars(progress: ProgressData, campaignIds: readonly string[]): number {
  return campaignIds.reduce((sum, id) => sum + (progress.levels[id]?.bestStars ?? 0), 0);
}
