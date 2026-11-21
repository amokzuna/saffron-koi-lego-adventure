import type { StompResult } from './BossBrain';

/**
 * Pyramid Sentinel (pure state machine): a hovering statue with multiple attack phases.
 * hover -> dropTelegraph (markers on the ground) -> boulders fall on the markers -> ... after N drops:
 * slamTelegraph (moves above the player, flashes) -> slam to the ground -> stunned (vulnerable, harmless)
 * -> rise -> hover. More boulders per drop and more drops per cycle as it takes damage.
 */
export type SentinelState = 'dormant' | 'hover' | 'dropTelegraph' | 'slamTelegraph' | 'slam' | 'stunned' | 'rise' | 'hurt' | 'defeated';

export interface SentinelConfig {
  maxHp: number;
  hoverSpeed: number;
  hoverMs: number;
  dropTelegraphMs: number;
  dropsBeforeSlam: readonly number[];
  bouldersPerDrop: readonly number[];
  boulderSpacingPx: number;
  slamTelegraphMs: number;
  stunnedMs: number;
  hurtMs: number;
  edgeMarginPx: number;
}

export const SENTINEL_CONFIG: SentinelConfig = {
  maxHp: 3,
  hoverSpeed: 110,
  hoverMs: 1400,
  dropTelegraphMs: 1100,
  dropsBeforeSlam: [2, 2, 3],
  bouldersPerDrop: [2, 3, 3],
  boulderSpacingPx: 190,
  slamTelegraphMs: 1000,
  stunnedMs: 2400,
  hurtMs: 800,
  edgeMarginPx: 40,
};

export interface SentinelFrame {
  deltaMs: number;
  x: number;
  playerX: number;
  onGround: boolean;
  atHoverHeight: boolean;
  arenaMinX: number;
  arenaMaxX: number;
}

export interface SentinelOutput {
  vx: number;
  vertical: 'hover' | 'slam' | 'rise' | 'stay';
  event: { type: 'boulders'; xs: number[] } | { type: 'landed' } | null;
}

const phaseValue = (values: readonly number[], index: number) => values[Math.min(index, values.length - 1)]!;

export class SentinelBrain {
  state: SentinelState = 'dormant';
  hp: number;
  /** Ground x positions currently marked for falling boulders. */
  markers: number[] = [];
  /** Horizontal target while lining up a slam. */
  slamX = 0;
  private timerMs = 0;
  private drops = 0;
  private direction: -1 | 1 = -1;

  constructor(readonly config: SentinelConfig = SENTINEL_CONFIG) {
    this.hp = config.maxHp;
  }

  private get hitsTaken() {
    return this.config.maxHp - this.hp;
  }

  get touchHurtsPlayer(): boolean {
    return this.state === 'hover' || this.state === 'dropTelegraph' || this.state === 'slamTelegraph' || this.state === 'slam';
  }

  activate() {
    if (this.state === 'dormant') this.enter('hover');
  }

  reset() {
    this.state = 'dormant';
    this.hp = this.config.maxHp;
    this.markers = [];
    this.timerMs = 0;
    this.drops = 0;
  }

  private enter(state: SentinelState) {
    this.state = state;
    this.timerMs = 0;
  }

  private clampX(x: number, f: SentinelFrame) {
    return Math.min(f.arenaMaxX - this.config.edgeMarginPx, Math.max(f.arenaMinX + this.config.edgeMarginPx, x));
  }

  /** Boulder targets: one on the player, the rest spread around it, always leaving gaps to stand in. */
  private chooseMarkers(f: SentinelFrame): number[] {
    const count = phaseValue(this.config.bouldersPerDrop, this.hitsTaken);
    const spacing = this.config.boulderSpacingPx;
    const xs = [this.clampX(f.playerX, f)];
    for (let i = 1; xs.length < count; i++) {
      for (const sign of [1, -1]) {
        if (xs.length >= count) break;
        const x = f.playerX + sign * i * spacing;
        if (x > f.arenaMinX + this.config.edgeMarginPx && x < f.arenaMaxX - this.config.edgeMarginPx) xs.push(x);
      }
      if (i > 10) break;
    }
    return xs;
  }

  update(f: SentinelFrame): SentinelOutput {
    this.timerMs += f.deltaMs;
    switch (this.state) {
      case 'dormant':
      case 'defeated':
        return { vx: 0, vertical: 'stay', event: null };
      case 'hover': {
        if (f.x <= f.arenaMinX + 60) this.direction = 1;
        if (f.x >= f.arenaMaxX - 60) this.direction = -1;
        if (this.timerMs >= this.config.hoverMs) {
          this.markers = this.chooseMarkers(f);
          this.enter('dropTelegraph');
        }
        return { vx: this.direction * this.config.hoverSpeed, vertical: 'hover', event: null };
      }
      case 'dropTelegraph': {
        if (this.timerMs < this.config.dropTelegraphMs) return { vx: 0, vertical: 'hover', event: null };
        const xs = this.markers;
        this.markers = [];
        this.drops++;
        if (this.drops >= phaseValue(this.config.dropsBeforeSlam, this.hitsTaken)) {
          this.drops = 0;
          this.slamX = this.clampX(f.playerX, f);
          this.enter('slamTelegraph');
        } else {
          this.enter('hover');
        }
        return { vx: 0, vertical: 'hover', event: { type: 'boulders', xs } };
      }
      case 'slamTelegraph': {
        const dx = this.slamX - f.x;
        if (this.timerMs >= this.config.slamTelegraphMs) {
          this.enter('slam');
          return { vx: 0, vertical: 'slam', event: null };
        }
        return { vx: Math.abs(dx) < 4 ? 0 : Math.sign(dx) * Math.min(260, Math.abs(dx) * 4), vertical: 'hover', event: null };
      }
      case 'slam':
        if (f.onGround) {
          this.enter('stunned');
          return { vx: 0, vertical: 'stay', event: { type: 'landed' } };
        }
        return { vx: 0, vertical: 'slam', event: null };
      case 'stunned':
        if (this.timerMs >= this.config.stunnedMs) this.enter('rise');
        return { vx: 0, vertical: 'stay', event: null };
      case 'rise':
        if (f.atHoverHeight) this.enter('hover');
        return { vx: 0, vertical: 'rise', event: null };
      case 'hurt':
        if (this.timerMs >= this.config.hurtMs) this.enter(this.hp <= 0 ? 'defeated' : 'rise');
        return { vx: 0, vertical: 'stay', event: null };
    }
  }

  stomp(): StompResult {
    if (this.state !== 'stunned') return 'bounced';
    this.hp = Math.max(0, this.hp - 1);
    this.enter('hurt');
    return 'damaged';
  }
}
