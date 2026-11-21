/**
 * Boss behavior as a pure state machine (no Phaser), so attack timing and fairness rules are testable.
 *
 * Cycle: walk toward the player -> telegraph (stops, flashes) -> charge in a straight line ->
 * hits an arena wall -> stunned (the safe window) -> walk again.
 * Only a stomp while stunned deals damage. Stomps at other times just bounce the player off.
 */
export type BossState = 'dormant' | 'walk' | 'telegraph' | 'charge' | 'stunned' | 'hurt' | 'defeated';

export interface BossConfig {
  maxHp: number;
  walkSpeed: number;
  /** Charge speed by hits taken (index 0 = full health). Later phases are faster. */
  chargeSpeeds: readonly number[];
  /** Walk duration before each telegraph, by hits taken. */
  walkMs: readonly number[];
  telegraphMs: number;
  stunnedMs: number;
  hurtMs: number;
}

export const GUARDIAN_CONFIG: BossConfig = {
  maxHp: 3,
  walkSpeed: 60,
  chargeSpeeds: [260, 300, 340],
  walkMs: [2200, 1800, 1400],
  telegraphMs: 900,
  stunnedMs: 2200,
  hurtMs: 800,
};

export interface BossFrame {
  deltaMs: number;
  /** Boss center x and player x, in px. */
  x: number;
  playerX: number;
  /** Boss is pressed against the arena edge in its facing direction. */
  atWallAhead: boolean;
}

export type StompResult = 'damaged' | 'bounced';

const phaseValue = (values: readonly number[], index: number) => values[Math.min(index, values.length - 1)]!;

export class BossBrain {
  state: BossState = 'dormant';
  hp: number;
  facing: -1 | 1 = -1;
  private timerMs = 0;

  constructor(readonly config: BossConfig = GUARDIAN_CONFIG) {
    this.hp = config.maxHp;
  }

  private get hitsTaken(): number {
    return this.config.maxHp - this.hp;
  }

  get isActive(): boolean {
    return this.state !== 'dormant' && this.state !== 'defeated';
  }

  /** Contact with the boss hurts the player only while it is a threat. */
  get touchHurtsPlayer(): boolean {
    return this.state === 'walk' || this.state === 'telegraph' || this.state === 'charge';
  }

  activate(): void {
    if (this.state === 'dormant') this.enter('walk');
  }

  reset(): void {
    this.state = 'dormant';
    this.hp = this.config.maxHp;
    this.facing = -1;
    this.timerMs = 0;
  }

  private enter(state: BossState): void {
    this.state = state;
    this.timerMs = 0;
  }

  /** Advances the state machine and returns the desired horizontal velocity (px/s). */
  update(frame: BossFrame): number {
    this.timerMs += frame.deltaMs;
    const towardPlayer: -1 | 1 = frame.playerX < frame.x ? -1 : 1;

    switch (this.state) {
      case 'dormant':
      case 'defeated':
        return 0;
      case 'walk':
        if (Math.abs(frame.playerX - frame.x) > 8) this.facing = towardPlayer;
        if (this.timerMs >= phaseValue(this.config.walkMs, this.hitsTaken)) {
          this.facing = towardPlayer;
          this.enter('telegraph');
          return 0;
        }
        return frame.atWallAhead ? 0 : this.facing * this.config.walkSpeed;
      case 'telegraph':
        // Direction is locked in at the start of the telegraph so the charge is predictable.
        if (this.timerMs >= this.config.telegraphMs) {
          this.enter('charge');
          return this.facing * phaseValue(this.config.chargeSpeeds, this.hitsTaken);
        }
        return 0;
      case 'charge':
        if (frame.atWallAhead) {
          this.enter('stunned');
          return 0;
        }
        return this.facing * phaseValue(this.config.chargeSpeeds, this.hitsTaken);
      case 'stunned':
        if (this.timerMs >= this.config.stunnedMs) this.enter('walk');
        return 0;
      case 'hurt':
        if (this.timerMs >= this.config.hurtMs) this.enter(this.hp <= 0 ? 'defeated' : 'walk');
        return 0;
    }
  }

  /** The player landed on top of the boss. */
  stomp(): StompResult {
    if (this.state !== 'stunned') return 'bounced';
    this.hp = Math.max(0, this.hp - 1);
    this.enter('hurt');
    return 'damaged';
  }
}
