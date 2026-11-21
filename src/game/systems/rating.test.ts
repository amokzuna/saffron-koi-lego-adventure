import { describe, expect, it } from 'vitest';
import { rateLevel } from './rating';

const totals = { coin: 10, brick: 3 };

describe('rateLevel', () => {
  it('awards one star for finishing', () => {
    const rating = rateLevel({ collected: { coin: 0, brick: 0 }, totals, elapsedMs: 200_000, parTimeMs: 90_000 });
    expect(rating.stars).toBe(1);
  });

  it('awards three stars for all bricks under par', () => {
    const rating = rateLevel({ collected: { coin: 2, brick: 3 }, totals, elapsedMs: 90_000, parTimeMs: 90_000 });
    expect(rating.stars).toBe(3);
    expect(rating.criteria.map((c) => c.met)).toEqual([true, true, true]);
  });

  it('labels criteria with the actual targets', () => {
    const rating = rateLevel({ collected: { coin: 0, brick: 1 }, totals, elapsedMs: 0, parTimeMs: 75_000 });
    expect(rating.criteria.map((c) => c.label)).toEqual(['Reach the goal', 'Find all 3 build bricks', 'Finish within 1:15']);
    expect(rating.stars).toBe(2);
  });
});

describe('rateLevel brick criterion wording', () => {
  it.each([
    [0, 'No build bricks to find'],
    [1, 'Find the build brick'],
    [4, 'Find all 4 build bricks'],
  ])('with %d bricks reads "%s"', (brick, label) => {
    const rating = rateLevel({ collected: { coin: 0, brick: 0 }, totals: { coin: 0, brick }, elapsedMs: 0, parTimeMs: 1 });
    expect(rating.criteria[1]?.label).toBe(label);
    expect(rating.criteria[1]?.met).toBe(brick === 0);
  });
});
