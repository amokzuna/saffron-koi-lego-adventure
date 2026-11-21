import { describe, expect, it } from 'vitest';
import { MOVEMENT } from '../game/config/movement';
import { analyzeReachability } from '../game/levels/reachability';
import { validateLevel } from '../game/levels/validateLevel';
import { CAMPAIGN_LEVELS, CAMPAIGN_LEVEL_IDS, WORLDS, campaignNumber, nextCampaignLevelId } from './campaign';

describe('campaign structure', () => {
  it('has five worlds with unique, ordered level ids', () => {
    expect(WORLDS).toHaveLength(5);
    expect(new Set(CAMPAIGN_LEVEL_IDS).size).toBe(CAMPAIGN_LEVEL_IDS.length);
    for (const world of WORLDS) for (const level of world.levels) expect(level.worldId).toBe(world.id);
  });

  it('World 1 has four levels ending in a boss', () => {
    const world1 = WORLDS[0]!;
    expect(world1.levels.map((l) => l.name)).toEqual(['Welcome Adventure', 'Mushroom Valley', 'Moving Platforms', 'Grassland Guardian']);
    expect(world1.levels[3]!.boss).toBeDefined();
  });

  it('World 2 has four levels ending in a boss', () => {
    const world2 = WORLDS[1]!;
    expect(world2.levels.map((l) => l.name)).toEqual(['Hidden Forest', 'Jungle Bridges', 'The Dark Cave', 'Forest Protector']);
    expect(world2.levels[3]!.boss?.kind).toBe('protector');
    expect(world2.levels[2]!.darkness).toBeDefined();
  });

  it('has all 20 levels, four per world, each world ending in a boss', () => {
    expect(CAMPAIGN_LEVELS).toHaveLength(20);
    for (const world of WORLDS) {
      expect(world.levels).toHaveLength(4);
      expect(world.levels[3]!.boss).toBeDefined();
      expect(world.levels.slice(0, 3).every((l) => !l.boss)).toBe(true);
    }
    expect(WORLDS.map((w) => w.levels[3]!.boss!.kind)).toEqual(['guardian', 'protector', 'sentinel', 'frost', 'final']);
  });

  it('matches the planned level names from LEVEL_DESIGN.md', () => {
    expect(CAMPAIGN_LEVELS.map((l) => l.name)).toEqual([
      'Welcome Adventure', 'Mushroom Valley', 'Moving Platforms', 'Grassland Guardian',
      'Hidden Forest', 'Jungle Bridges', 'The Dark Cave', 'Forest Protector',
      'Sandy Adventure', 'Ancient Pyramid', 'Desert Storm', 'Pyramid Sentinel',
      'Snowy Mountains', 'Ice Slides', 'Frozen Castle', 'Frost Guardian',
      'Fire Valley', 'Lava Bridges', 'Volcano Challenge', 'Final Guardian',
    ]);
  });

  it('numbers and chains levels', () => {
    expect(campaignNumber('w1-1')).toBe(1);
    expect(campaignNumber('sandbox')).toBeNull();
    expect(nextCampaignLevelId('w1-1')).toBe('w1-2');
    expect(nextCampaignLevelId('w1-4')).toBe('w2-1');
    expect(nextCampaignLevelId(CAMPAIGN_LEVEL_IDS.at(-1)!)).toBeNull();
  });
});

describe.each(CAMPAIGN_LEVELS.map((l) => [`${l.id} ${l.name}`, l] as const))('level %s', (_label, level) => {
  it('passes validation', () => {
    expect(validateLevel(level)).toEqual([]);
  });

  it('has a reachable goal and reachable bricks and coins without power-ups', () => {
    const report = analyzeReachability(level, MOVEMENT);
    expect(report.goalReachable).toBe(true);
    expect(report.unreachableCollectibles).toEqual([]);
  });

  it('has exactly three build bricks and at least one checkpoint', () => {
    expect(level.collectibles.filter((c) => c.kind === 'brick')).toHaveLength(3);
    expect(level.checkpoints.length).toBeGreaterThan(0);
  });
});
