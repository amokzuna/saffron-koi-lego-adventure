import { describe, expect, it } from 'vitest';
import type { LevelResult } from '../../game/bridge/GameBridge';
import { emptyProgress, isUnlocked, levelStatus, nextLevelToPlay, parseProgress, recordResult, totalStars } from './progress';

const IDS = ['a', 'b', 'c', 'd'];

const result = (levelId: string, overrides: Partial<LevelResult> = {}): LevelResult => ({
  levelId,
  levelName: levelId,
  elapsedMs: 50_000,
  collected: { coin: 10, brick: 2 },
  totals: { coin: 20, brick: 3 },
  falls: 0,
  heartsLost: 0,
  gameOvers: 0,
  rating: { stars: 2, criteria: [] },
  ...overrides,
});

describe('unlock rules', () => {
  it('starts with only the first level available', () => {
    const p = emptyProgress();
    expect(IDS.map((id) => levelStatus(p, IDS, id))).toEqual(['available', 'locked', 'locked', 'locked']);
    expect(nextLevelToPlay(p, IDS)).toBe('a');
  });

  it('completing a level unlocks the next one only', () => {
    const { progress } = recordResult(emptyProgress(), result('a'));
    expect(IDS.map((id) => levelStatus(progress, IDS, id))).toEqual(['completed', 'available', 'locked', 'locked']);
    expect(nextLevelToPlay(progress, IDS)).toBe('b');
  });

  it('completed levels remain replayable', () => {
    const { progress } = recordResult(emptyProgress(), result('a'));
    expect(isUnlocked(progress, IDS, 'a')).toBe(true);
  });

  it('unknown levels are locked and the last level is suggested when everything is done', () => {
    let p = emptyProgress();
    for (const id of IDS) p = recordResult(p, result(id)).progress;
    expect(isUnlocked(p, IDS, 'zzz')).toBe(false);
    expect(nextLevelToPlay(p, IDS)).toBe('d');
    expect(totalStars(p, IDS)).toBe(8);
  });
});

describe('recordResult', () => {
  it('keeps the best value of each stat independently', () => {
    let p = recordResult(emptyProgress(), result('a', { elapsedMs: 40_000, rating: { stars: 1, criteria: [] } })).progress;
    const outcome = recordResult(p, result('a', { elapsedMs: 60_000, collected: { coin: 15, brick: 3 }, rating: { stars: 3, criteria: [] } }));
    p = outcome.progress;
    expect(p.levels.a).toEqual({ completed: true, bestStars: 3, bestTimeMs: 40_000, bestCoins: 15, bestBricks: 3 });
    expect(outcome).toMatchObject({ firstCompletion: false, newBestStars: true, newBestTime: false });
  });

  it('reports first completions', () => {
    expect(recordResult(emptyProgress(), result('a')).firstCompletion).toBe(true);
  });

  it('does not mutate the previous progress object', () => {
    const p = emptyProgress();
    recordResult(p, result('a'));
    expect(p.levels).toEqual({});
  });
});

describe('parseProgress', () => {
  it('returns empty progress for corrupt or unknown data', () => {
    expect(parseProgress(null)).toEqual(emptyProgress());
    expect(parseProgress('garbage')).toEqual(emptyProgress());
    expect(parseProgress({ version: 2, levels: {} })).toEqual(emptyProgress());
    expect(parseProgress({ version: 1, levels: 'nope' })).toEqual(emptyProgress());
  });

  it('drops invalid level records but keeps valid ones', () => {
    const parsed = parseProgress({
      version: 1,
      levels: {
        a: { completed: true, bestStars: 2, bestTimeMs: 1000, bestCoins: 5, bestBricks: 1 },
        b: { completed: true, bestStars: 'three' },
        c: { completed: false, bestStars: 1, bestTimeMs: 1, bestCoins: 1, bestBricks: 1 },
      },
    });
    expect(Object.keys(parsed.levels)).toEqual(['a']);
  });

  it('clamps out-of-range stars', () => {
    const parsed = parseProgress({ version: 1, levels: { a: { completed: true, bestStars: 99, bestTimeMs: 1, bestCoins: 0, bestBricks: 0 } } });
    expect(parsed.levels.a?.bestStars).toBe(3);
  });
});
