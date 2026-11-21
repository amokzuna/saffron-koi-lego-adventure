import type { HudState, LevelResult } from '../bridge/GameBridge';
import { GAMEPLAY } from '../config/gameplay';
import type { MovementConfig } from '../config/movement';
import type { LevelDefinition, PowerUpKind, TilePoint } from '../levels/types';
import { CheckpointTracker } from './CheckpointTracker';
import { CollectibleTracker } from './CollectibleTracker';
import { HealthSystem } from './HealthSystem';
import { POWER_UPS, PowerUpSystem, applyModifiers } from './powerUps';
import { rateLevel } from './rating';

export type SessionState = 'playing' | 'gameOver' | 'complete';

/** Result of the player being hit by an enemy or hazard. */
export type HitOutcome = 'ignored' | 'shielded' | 'hurt' | 'dead';

export type PowerUpPickupOutcome = { kind: PowerUpKind; healed: number };

/**
 * All per-attempt state for one level run, independent of Phaser.
 * The scene feeds it events (hits, falls, pickups) and renders what it reports.
 */
export class LevelSession {
  readonly health = new HealthSystem(GAMEPLAY.maxHearts, GAMEPLAY.invulnerabilityMs);
  readonly powerUps = new PowerUpSystem();
  readonly collectibles: CollectibleTracker;
  readonly checkpoints: CheckpointTracker;
  private readonly collectedPowerUps = new Set<string>();

  /** Game clock: advances whenever the level is running (not paused). Drives invulnerability and power-up timers. */
  clockMs = 0;
  /** Completion timer: stops on game over and completion. */
  elapsedMs = 0;
  falls = 0;
  heartsLost = 0;
  gameOvers = 0;
  state: SessionState = 'playing';

  constructor(private readonly level: LevelDefinition) {
    this.collectibles = new CollectibleTracker(level.collectibles);
    this.checkpoints = new CheckpointTracker(level.spawn, level.checkpoints);
  }

  /** Advances clocks. Returns power-ups that expired this tick. */
  tick(deltaMs: number): PowerUpKind[] {
    this.clockMs += deltaMs;
    if (this.state === 'playing') this.elapsedMs += deltaMs;
    return this.powerUps.update(this.clockMs);
  }

  get isPlaying(): boolean {
    return this.state === 'playing';
  }

  isInvulnerable(): boolean {
    return this.health.isInvulnerable(this.clockMs);
  }

  movementConfig(base: MovementConfig): MovementConfig {
    return applyModifiers(base, this.powerUps.modifiers(this.clockMs));
  }

  /** Enemy or hazard contact. Shields absorb the hit; invulnerability ignores it. */
  hit(): HitOutcome {
    if (!this.isPlaying || this.health.isInvulnerable(this.clockMs)) return 'ignored';
    if (this.powerUps.consumeDamageBlock(this.clockMs)) {
      this.health.grantInvulnerability(this.clockMs);
      return 'shielded';
    }
    return this.applyDamage(this.health.damage(this.clockMs));
  }

  /** Fell into a pit: always costs a heart, regardless of shield or invulnerability. */
  fall(): HitOutcome {
    if (!this.isPlaying) return 'ignored';
    this.falls++;
    return this.applyDamage(this.health.damage(this.clockMs, { force: true }));
  }

  private applyDamage(outcome: 'ignored' | 'hurt' | 'dead'): HitOutcome {
    if (outcome === 'ignored') return 'ignored';
    this.heartsLost++;
    if (outcome === 'dead') {
      this.state = 'gameOver';
      this.gameOvers++;
      this.powerUps.clear();
    }
    return outcome;
  }

  /** Continue after game over: full hearts at the last checkpoint. Collected items stay collected. */
  continueFromCheckpoint(): TilePoint {
    this.health.reset(this.clockMs);
    this.state = 'playing';
    return this.checkpoints.respawnPoint;
  }

  collectPowerUp(id: string, kind: PowerUpKind): PowerUpPickupOutcome | null {
    if (!this.isPlaying || this.collectedPowerUps.has(id)) return null;
    this.collectedPowerUps.add(id);
    const def = POWER_UPS[kind];
    if (def.type === 'instant') return { kind, healed: this.health.heal(def.healHearts) };
    this.powerUps.activate(kind, this.clockMs);
    return { kind, healed: 0 };
  }

  complete(): LevelResult | null {
    if (!this.isPlaying) return null;
    this.state = 'complete';
    const collected = this.collectibles.counts;
    const totals = this.collectibles.totals;
    return {
      levelId: this.level.id,
      levelName: this.level.name,
      elapsedMs: this.elapsedMs,
      collected,
      totals,
      falls: this.falls,
      heartsLost: this.heartsLost,
      gameOvers: this.gameOvers,
      rating: rateLevel({ collected, totals, elapsedMs: this.elapsedMs, parTimeMs: this.level.parTimeMs }),
    };
  }

  hud(): HudState {
    return {
      levelName: this.level.name,
      collected: this.collectibles.counts,
      totals: this.collectibles.totals,
      elapsedMs: this.elapsedMs,
      falls: this.falls,
      hearts: this.health.current,
      maxHearts: this.health.maxHearts,
      powerUps: this.powerUps.list(this.clockMs),
      boss: null,
    };
  }
}
