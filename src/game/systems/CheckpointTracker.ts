import type { CheckpointPlacement, TilePoint } from '../levels/types';

/**
 * Tracks which checkpoints are active and where the player should respawn.
 * Checkpoints only move the respawn point forward (by x), so touching an
 * earlier flag on the way back never sends the player further back.
 */
export class CheckpointTracker {
  private readonly activated = new Set<string>();
  private current: TilePoint;
  private currentId: string | null = null;

  constructor(
    private readonly spawn: TilePoint,
    private readonly placements: readonly CheckpointPlacement[],
  ) {
    this.current = spawn;
  }

  /** Returns true if this call activated the checkpoint (first touch). */
  activate(id: string): boolean {
    const placement = this.placements.find((p) => p.id === id);
    if (!placement || this.activated.has(id)) return false;
    this.activated.add(id);
    if (placement.x >= this.current.x || this.currentId === null) {
      this.current = { x: placement.x, y: placement.y };
      this.currentId = id;
    }
    return true;
  }

  isActive(id: string): boolean {
    return this.activated.has(id);
  }

  get respawnPoint(): TilePoint {
    return this.current;
  }

  /** ID of the checkpoint the player will respawn at, or null for the level spawn. */
  get activeCheckpointId(): string | null {
    return this.currentId;
  }

  get levelSpawn(): TilePoint {
    return this.spawn;
  }
}
