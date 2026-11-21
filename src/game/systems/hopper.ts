/**
 * Hop timing for Spore Hoppers: they rest on the ground for `intervalMs`, then hop.
 * Time only accumulates while grounded, so every hop is preceded by a full, readable pause.
 */
export class HopTimer {
  private groundedMs: number;

  constructor(
    private readonly intervalMs: number,
    /** Offset so neighbouring hoppers don't hop in sync. */
    initialMs = 0,
  ) {
    this.groundedMs = initialMs;
  }

  /** Returns true on the frame the hopper should jump. */
  update(deltaMs: number, onGround: boolean): boolean {
    if (!onGround) return false;
    this.groundedMs += deltaMs;
    if (this.groundedMs < this.intervalMs) return false;
    this.groundedMs = 0;
    return true;
  }
}
