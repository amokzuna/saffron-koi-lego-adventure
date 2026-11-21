export type CrumbleState = 'solid' | 'shaking' | 'fallen';

export interface CrumbleConfig {
  /** Time from first touch until the plank falls. */
  shakeMs: number;
  /** Time a fallen plank stays gone before trying to respawn. */
  respawnMs: number;
}

export const CRUMBLE_CONFIG: CrumbleConfig = { shakeMs: 450, respawnMs: 3000 };

/**
 * One crumbling plank: solid -> (stood on) shaking -> fallen -> (after respawnMs, if not blocked) solid.
 * Respawn waits while something occupies the space so the plank never traps the player.
 */
export class CrumbleTile {
  state: CrumbleState = 'solid';
  private timerMs = 0;

  constructor(private readonly config: CrumbleConfig = CRUMBLE_CONFIG) {}

  touch(): void {
    if (this.state !== 'solid') return;
    this.state = 'shaking';
    this.timerMs = 0;
  }

  /** Advances time. Returns the new state when it changed this call, else null. */
  update(deltaMs: number, respawnBlocked: boolean): CrumbleState | null {
    if (this.state === 'solid') return null;
    this.timerMs += deltaMs;
    if (this.state === 'shaking' && this.timerMs >= this.config.shakeMs) {
      this.state = 'fallen';
      this.timerMs = 0;
      return 'fallen';
    }
    if (this.state === 'fallen' && this.timerMs >= this.config.respawnMs && !respawnBlocked) {
      this.state = 'solid';
      this.timerMs = 0;
      return 'solid';
    }
    return null;
  }

  get isSolid(): boolean {
    return this.state !== 'fallen';
  }
}
