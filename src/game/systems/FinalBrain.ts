/**
 * Final Guardian phase controller (pure). The final boss reuses the two earlier, tested attack styles:
 * each phase runs either a charge cycle (like the Grassland Guardian) or a leap cycle (like the Forest
 * Protector). One successful stomp ends a phase. From phase 3, telegraphed boulders also rain periodically.
 */
export type FinalMode = 'charge' | 'leap';

export interface FinalConfig {
  maxHp: number;
  modes: readonly FinalMode[];
  /** Phase index from which boulder rain starts. */
  rainFromPhase: number;
  rainIntervalMs: number;
  rainBoulders: number;
}

export const FINAL_CONFIG: FinalConfig = {
  maxHp: 4,
  modes: ['charge', 'leap', 'charge', 'leap'],
  rainFromPhase: 2,
  rainIntervalMs: 3600,
  rainBoulders: 2,
};

export class FinalPhases {
  hp: number;
  private rainTimerMs = 0;

  constructor(readonly config: FinalConfig = FINAL_CONFIG) {
    this.hp = config.maxHp;
  }

  get phase(): number {
    return this.config.maxHp - this.hp;
  }

  get mode(): FinalMode {
    return this.config.modes[Math.min(this.phase, this.config.modes.length - 1)]!;
  }

  get defeated(): boolean {
    return this.hp <= 0;
  }

  /** Records a phase-ending hit. Returns true if this was the final hit. */
  hit(): boolean {
    this.hp = Math.max(0, this.hp - 1);
    this.rainTimerMs = 0;
    return this.hp === 0;
  }

  /** Returns true when a boulder rain should start (only while active and in rain phases). */
  updateRain(deltaMs: number, active: boolean): boolean {
    if (!active || this.defeated || this.phase < this.config.rainFromPhase) return false;
    this.rainTimerMs += deltaMs;
    if (this.rainTimerMs < this.config.rainIntervalMs) return false;
    this.rainTimerMs = 0;
    return true;
  }

  reset(): void {
    this.hp = this.config.maxHp;
    this.rainTimerMs = 0;
  }
}
