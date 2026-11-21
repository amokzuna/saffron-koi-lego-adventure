import type { StompResult } from './BossBrain';

/**
 * Forest Protector: a leaping boss (pure state machine).
 *
 * Cycle: idle (faces the player) -> telegraph (crouches and glows; a target shadow marks where it will land,
 * locked at the player's position) -> leap (airborne) -> lands and sends shockwaves along the ground ->
 * stuck (roots caught: harmless and vulnerable) -> idle.
 * Later phases send faster shockwaves, and the final phase chains two leaps before getting stuck.
 */
export type ProtectorState = 'dormant' | 'idle' | 'telegraph' | 'leap' | 'stuck' | 'hurt' | 'defeated';

export interface ProtectorConfig {
  maxHp: number;
  idleMs: readonly number[];
  telegraphMs: number;
  leapDurationMs: number;
  stuckMs: number;
  hurtMs: number;
  leapsPerCycle: readonly number[];
  shockwaveSpeeds: readonly number[];
  /** Ignore "grounded" readings this soon after take-off. */
  minAirMs: number;
  /** Keep landing targets this far inside the arena edges (px). */
  edgeMarginPx: number;
}

export const PROTECTOR_CONFIG: ProtectorConfig = {
  maxHp: 3,
  idleMs: [1600, 1300, 1100],
  telegraphMs: 1000,
  leapDurationMs: 1000,
  stuckMs: 2400,
  hurtMs: 800,
  leapsPerCycle: [1, 1, 2],
  shockwaveSpeeds: [200, 240, 280],
  minAirMs: 200,
  edgeMarginPx: 48,
};

export interface ProtectorFrame {
  deltaMs: number;
  x: number;
  playerX: number;
  onGround: boolean;
  arenaMinX: number;
  arenaMaxX: number;
}

export type ProtectorCommand =
  | { type: 'none' }
  | { type: 'leap'; targetX: number; durationMs: number }
  | { type: 'land'; shockwaveSpeed: number };

const NONE: ProtectorCommand = { type: 'none' };
const phaseValue = (values: readonly number[], index: number) => values[Math.min(index, values.length - 1)]!;

export class ProtectorBrain {
  state: ProtectorState = 'dormant';
  hp: number;
  facing: -1 | 1 = -1;
  /** Landing target (px) shown during the telegraph and leap. */
  targetX = 0;
  private timerMs = 0;
  private leapsThisCycle = 0;

  constructor(readonly config: ProtectorConfig = PROTECTOR_CONFIG) {
    this.hp = config.maxHp;
  }

  private get hitsTaken(): number {
    return this.config.maxHp - this.hp;
  }

  get touchHurtsPlayer(): boolean {
    return this.state === 'idle' || this.state === 'telegraph' || this.state === 'leap';
  }

  get showsTarget(): boolean {
    return this.state === 'telegraph' || this.state === 'leap';
  }

  activate(): void {
    if (this.state === 'dormant') this.enter('idle');
  }

  reset(): void {
    this.state = 'dormant';
    this.hp = this.config.maxHp;
    this.facing = -1;
    this.timerMs = 0;
    this.leapsThisCycle = 0;
  }

  private enter(state: ProtectorState): void {
    this.state = state;
    this.timerMs = 0;
  }

  private startTelegraph(frame: ProtectorFrame): void {
    const min = frame.arenaMinX + this.config.edgeMarginPx;
    const max = frame.arenaMaxX - this.config.edgeMarginPx;
    this.targetX = Math.min(max, Math.max(min, frame.playerX));
    this.facing = this.targetX < frame.x ? -1 : 1;
    this.enter('telegraph');
  }

  update(frame: ProtectorFrame): ProtectorCommand {
    this.timerMs += frame.deltaMs;
    switch (this.state) {
      case 'dormant':
      case 'defeated':
        return NONE;
      case 'idle':
        this.facing = frame.playerX < frame.x ? -1 : 1;
        if (this.timerMs >= phaseValue(this.config.idleMs, this.hitsTaken)) {
          this.leapsThisCycle = 0;
          this.startTelegraph(frame);
        }
        return NONE;
      case 'telegraph':
        if (this.timerMs < this.config.telegraphMs) return NONE;
        this.enter('leap');
        return { type: 'leap', targetX: this.targetX, durationMs: this.config.leapDurationMs };
      case 'leap': {
        if (this.timerMs < this.config.minAirMs || !frame.onGround) return NONE;
        this.leapsThisCycle++;
        const speed = phaseValue(this.config.shockwaveSpeeds, this.hitsTaken);
        if (this.leapsThisCycle < phaseValue(this.config.leapsPerCycle, this.hitsTaken)) this.startTelegraph(frame);
        else this.enter('stuck');
        return { type: 'land', shockwaveSpeed: speed };
      }
      case 'stuck':
        if (this.timerMs >= this.config.stuckMs) this.enter('idle');
        return NONE;
      case 'hurt':
        if (this.timerMs >= this.config.hurtMs) this.enter(this.hp <= 0 ? 'defeated' : 'idle');
        return NONE;
    }
  }

  stomp(): StompResult {
    if (this.state !== 'stuck') return 'bounced';
    this.hp = Math.max(0, this.hp - 1);
    this.enter('hurt');
    return 'damaged';
  }
}
