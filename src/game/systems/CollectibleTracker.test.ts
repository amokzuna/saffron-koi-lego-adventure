import { describe, expect, it } from 'vitest';
import { CollectibleTracker } from './CollectibleTracker';

const placements = [
  { id: 'c1', kind: 'coin' as const, x: 0, y: 0 },
  { id: 'c2', kind: 'coin' as const, x: 1, y: 0 },
  { id: 'b1', kind: 'brick' as const, x: 2, y: 0 },
];

describe('CollectibleTracker', () => {
  it('counts each pickup exactly once', () => {
    const tracker = new CollectibleTracker(placements);
    expect(tracker.collect('c1')).toBe(true);
    expect(tracker.collect('c1')).toBe(false);
    expect(tracker.counts).toEqual({ coin: 1, brick: 0 });
  });

  it('ignores unknown ids', () => {
    const tracker = new CollectibleTracker(placements);
    expect(tracker.collect('nope')).toBe(false);
    expect(tracker.counts).toEqual({ coin: 0, brick: 0 });
  });

  it('reports totals by kind', () => {
    const tracker = new CollectibleTracker(placements);
    tracker.collect('b1');
    expect(tracker.totals).toEqual({ coin: 2, brick: 1 });
    expect(tracker.counts).toEqual({ coin: 0, brick: 1 });
  });
});
