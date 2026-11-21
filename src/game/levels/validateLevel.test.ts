import { describe, expect, it } from 'vitest';
import { LEVELS } from '../../data/levels';
import { TEST_LEVEL } from '../../data/levels/testLevel';
import type { LevelDefinition } from './types';
import { validateLevel } from './validateLevel';

const base = (): LevelDefinition => structuredClone(TEST_LEVEL);

describe('validateLevel', () => {
  it.each(Object.values(LEVELS).map((l) => [l.id, l] as const))('accepts registered level %s', (_id, level) => {
    expect(validateLevel(level)).toEqual([]);
  });

  it('flags duplicate ids across entity types', () => {
    const level = base();
    level.powerUps.push({ id: level.collectibles[0]!.id, kind: 'shield', x: 2, y: 13 });
    expect(validateLevel(level).some((e) => e.includes('Duplicate'))).toBe(true);
  });

  it('flags a spawn with no ground beneath it', () => {
    const level = base();
    level.spawn = { x: 31, y: 13 }; // above the first pit
    expect(validateLevel(level)).toContain('spawn has no solid ground directly below it.');
  });

  it('flags collectibles embedded in solids', () => {
    const level = base();
    level.collectibles.push({ id: 'buried', kind: 'coin', x: 2, y: 15 });
    expect(validateLevel(level)).toContain('"buried" is inside a solid block.');
  });

  it('flags solids that extend outside the level', () => {
    const level = base();
    level.solids.push({ x: 118, y: 5, width: 5, height: 1, style: 'platform' });
    expect(validateLevel(level).some((e) => e.includes('outside the level bounds'))).toBe(true);
  });

  it('flags hazards floating over a pit', () => {
    const level = base();
    level.hazards.push({ id: 'floating-spikes', kind: 'spikes', x: 30, y: 13, width: 2 });
    expect(validateLevel(level).some((e) => e.includes('floating-spikes') && e.includes('unsupported'))).toBe(true);
  });

  it('flags enemies starting outside their patrol range', () => {
    const level = base();
    level.enemies.push({ id: 'lost', kind: 'walker', x: 5, y: 13, patrolMinX: 8, patrolMaxX: 12 });
    expect(validateLevel(level)).toContain('Enemy "lost" starts outside its patrol range.');
  });

  it('flags checkpoints without ground', () => {
    const level = base();
    level.checkpoints.push({ id: 'cp-air', x: 10, y: 5 });
    expect(validateLevel(level)).toContain('Checkpoint "cp-air" has no solid ground directly below it.');
  });
});
