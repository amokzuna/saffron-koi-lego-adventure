import type { StompResult } from './BossBrain';

/**
 * Frost Guardian (pure state machine): telegraphed area attacks.
 * idle (walks slowly toward the player) -> telegraph (frost marks on alternating arena segments) ->
 * erupt (ice spikes burst from the marked segments) -> ... after N eruptions -> exhausted (kneels:
 * harmless and vulnerable) -> idle. Marked segments alternate, so a safe segment is always adjacent.
 */
export type FrostState = 'dormant' | 'idle' | 'telegraph' | 'erupt' | 'exhausted' | 'hurt' | 'defeated';

export interface FrostConfig {
  maxHp: number;
  walkSpeed: number;
  idleMs: readonly number[];
  telegraphMs: readonly number[];
  eruptMs: number;
  eruptionsBeforeRest: readonly number[];
  exhaustedMs: number;
  hurtMs: number;
  segments: number;
}

export const FROST_CONFIG: FrostConfig = {
  maxHp: 3,
  walkSpeed: 55,
  idleMs: [1400, 1100, 900],
  telegraphMs: [1200, 1050, 950],
  eruptMs: 700,
  eruptionsBeforeRest: [2, 3, 3],
  exhaustedMs: 2800,
  hurtMs: 800,
  segments: 8,
};

export interface FrostFrame {
  deltaMs: number;
  x: number;
  playerX: number;
  arenaMinX: number;
  arenaMaxX: number;
}

export type Zone = [number, number];

export interface FrostOutput {
  vx: number;
  event: { type: 'erupt'; zones: Zone[]; durationMs: number } | null;
}

const phaseValue = (values: readonly number[], index: number) => values[Math.min(index, values.length - 1)]!;

/** Alternating segments: parity 0 marks segments 0, 2, 4...; parity 1 marks 1, 3, 5... */
export function alternatingZones(minX: number, maxX: number, segments: number, parity: number): Zone[] {
  const width = (maxX - minX) / segments;
  const zones: Zone[] = [];
  for (let i = parity % 2; i < segments; i += 2) zones.push([minX + i * width, minX + (i + 1) * width]);
  return zones;
}

export class FrostBrain {
  state: FrostState = 'dormant';
  hp: number;
  zones: Zone[] = [];
  facing: -1 | 1 = -1;
  private timerMs = 0;
  private eruptions = 0;
  private parity = 0;

  constructor(readonly config: FrostConfig = FROST_CONFIG) {
    this.hp = config.maxHp;
  }

  private get hitsTaken() {
    return this.config.maxHp - this.hp;
  }

  get touchHurtsPlayer() {
    return this.state === 'idle' || this.state === 'telegraph' || this.state === 'erupt';
  }

  activate() {
    if (this.state === 'dormant') this.enter('idle');
  }

  reset() {
    this.state = 'dormant';
    this.hp = this.config.maxHp;
    this.zones = [];
    this.timerMs = 0;
    this.eruptions = 0;
    this.parity = 0;
  }

  private enter(state: FrostState) {
    this.state = state;
    this.timerMs = 0;
  }

  update(f: FrostFrame): FrostOutput {
    this.timerMs += f.deltaMs;
    switch (this.state) {
      case 'dormant':
      case 'defeated':
        return { vx: 0, event: null };
      case 'idle': {
        this.facing = f.playerX < f.x ? -1 : 1;
        if (this.timerMs >= phaseValue(this.config.idleMs, this.hitsTaken)) {
          this.zones = alternatingZones(f.arenaMinX, f.arenaMaxX, this.config.segments, this.parity);
          this.enter('telegraph');
          return { vx: 0, event: null };
        }
        return { vx: Math.abs(f.playerX - f.x) > 120 ? this.facing * this.config.walkSpeed : 0, event: null };
      }
      case 'telegraph':
        if (this.timerMs < phaseValue(this.config.telegraphMs, this.hitsTaken)) return { vx: 0, event: null };
        this.enter('erupt');
        return { vx: 0, event: { type: 'erupt', zones: this.zones, durationMs: this.config.eruptMs } };
      case 'erupt':
        if (this.timerMs < this.config.eruptMs) return { vx: 0, event: null };
        this.eruptions++;
        this.parity++;
        this.zones = [];
        if (this.eruptions >= phaseValue(this.config.eruptionsBeforeRest, this.hitsTaken)) {
          this.eruptions = 0;
          this.enter('exhausted');
        } else {
          this.zones = alternatingZones(f.arenaMinX, f.arenaMaxX, this.config.segments, this.parity);
          this.enter('telegraph');
        }
        return { vx: 0, event: null };
      case 'exhausted':
        if (this.timerMs >= this.config.exhaustedMs) this.enter('idle');
        return { vx: 0, event: null };
      case 'hurt':
        if (this.timerMs >= this.config.hurtMs) this.enter(this.hp <= 0 ? 'defeated' : 'idle');
        return { vx: 0, event: null };
    }
  }

  stomp(): StompResult {
    if (this.state !== 'exhausted') return 'bounced';
    this.hp = Math.max(0, this.hp - 1);
    this.enter('hurt');
    return 'damaged';
  }
}
