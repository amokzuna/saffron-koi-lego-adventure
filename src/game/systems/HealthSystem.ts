export type DamageOutcome = 'ignored' | 'hurt' | 'dead';

/**
 * Tracks hearts and post-hit invulnerability. Time is passed in explicitly so the
 * system follows the game clock (which stops while paused) and is easy to test.
 */
export class HealthSystem {
  private hearts: number;
  private invulnerableUntilMs = 0;

  constructor(
    readonly maxHearts: number,
    private readonly invulnerabilityMs: number,
  ) {
    this.hearts = maxHearts;
  }

  get current(): number {
    return this.hearts;
  }

  get isDead(): boolean {
    return this.hearts <= 0;
  }

  isInvulnerable(nowMs: number): boolean {
    return nowMs < this.invulnerableUntilMs;
  }

  /**
   * Removes one heart unless invulnerable. `force` bypasses invulnerability
   * (used for pits, which must always cost a heart).
   */
  damage(nowMs: number, options: { force?: boolean } = {}): DamageOutcome {
    if (this.isDead) return 'ignored';
    if (!options.force && this.isInvulnerable(nowMs)) return 'ignored';
    this.hearts -= 1;
    this.grantInvulnerability(nowMs);
    return this.hearts <= 0 ? 'dead' : 'hurt';
  }

  /** Restores hearts up to the maximum. Returns how many hearts were actually restored. */
  heal(amount: number): number {
    const before = this.hearts;
    this.hearts = Math.min(this.maxHearts, this.hearts + amount);
    return this.hearts - before;
  }

  grantInvulnerability(nowMs: number): void {
    this.invulnerableUntilMs = nowMs + this.invulnerabilityMs;
  }

  /** Full hearts, used when continuing after game over. */
  reset(nowMs: number): void {
    this.hearts = this.maxHearts;
    this.grantInvulnerability(nowMs);
  }
}
