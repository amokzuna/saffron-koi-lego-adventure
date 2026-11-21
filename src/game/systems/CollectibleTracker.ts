import type { CollectibleKind, CollectiblePlacement } from '../levels/types';

export type CollectibleCounts = Record<CollectibleKind, number>;

/**
 * Tracks which collectibles have been picked up. Guarantees each collectible
 * is counted exactly once, even if overlap callbacks fire repeatedly.
 */
export class CollectibleTracker {
  private readonly kinds = new Map<string, CollectibleKind>();
  private readonly collected = new Set<string>();

  constructor(placements: readonly CollectiblePlacement[]) {
    for (const p of placements) this.kinds.set(p.id, p.kind);
  }

  /** Returns true only the first time a known collectible id is collected. */
  collect(id: string): boolean {
    if (!this.kinds.has(id) || this.collected.has(id)) return false;
    this.collected.add(id);
    return true;
  }

  get counts(): CollectibleCounts {
    const counts: CollectibleCounts = { coin: 0, brick: 0 };
    for (const id of this.collected) counts[this.kinds.get(id)!]++;
    return counts;
  }

  get totals(): CollectibleCounts {
    const totals: CollectibleCounts = { coin: 0, brick: 0 };
    for (const kind of this.kinds.values()) totals[kind]++;
    return totals;
  }
}
