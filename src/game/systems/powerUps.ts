import type { MovementConfig } from '../config/movement';
import type { PowerUpKind } from '../levels/types';

/**
 * Power-up framework. Each definition declares its duration and effect; the
 * PowerUpSystem tracks active timers. Balancing rules (documented in docs/GAMEPLAY_SYSTEMS.md):
 * - Picking up a timed power-up that is already active refreshes its full duration (no stacking).
 * - Different power-ups can be active together; multipliers combine by multiplication.
 * - Instant power-ups have no duration and are never "active".
 */
export interface MovementModifiers {
  speedMultiplier: number;
  jumpMultiplier: number;
}

interface PowerUpBase {
  kind: PowerUpKind;
  label: string;
  /** Short text shown in-game when collected. */
  pickupText: string;
  description: string;
}

export interface TimedPowerUp extends PowerUpBase {
  type: 'timed';
  durationMs: number;
  modifiers?: Partial<MovementModifiers>;
  /** Absorbs the next hit (non-pit) and then ends early. */
  blocksDamage?: boolean;
}

export interface InstantPowerUp extends PowerUpBase {
  type: 'instant';
  healHearts: number;
}

export type PowerUpDefinition = TimedPowerUp | InstantPowerUp;

export const POWER_UPS: Record<PowerUpKind, PowerUpDefinition> = {
  superJump: {
    kind: 'superJump',
    type: 'timed',
    label: 'Super Jump',
    pickupText: 'SUPER JUMP!',
    description: 'Jump about 55% higher for 10 seconds.',
    durationMs: 10_000,
    modifiers: { jumpMultiplier: 1.25 },
  },
  speedBoost: {
    kind: 'speedBoost',
    type: 'timed',
    label: 'Speed Boost',
    pickupText: 'SPEED BOOST!',
    description: 'Run 40% faster for 8 seconds.',
    durationMs: 8_000,
    modifiers: { speedMultiplier: 1.4 },
  },
  shield: {
    kind: 'shield',
    type: 'timed',
    label: 'Shield',
    pickupText: 'SHIELD!',
    description: 'Blocks the next hit from an enemy or hazard within 12 seconds. Does not protect from pits.',
    durationMs: 12_000,
    blocksDamage: true,
  },
  extraHeart: {
    kind: 'extraHeart',
    type: 'instant',
    label: 'Extra Heart',
    pickupText: '+1 HEART',
    description: 'Restores one heart (up to the maximum).',
    healHearts: 1,
  },
};

export interface ActivePowerUp {
  kind: PowerUpKind;
  label: string;
  remainingMs: number;
  durationMs: number;
}

export class PowerUpSystem {
  /** kind -> expiry time on the game clock */
  private readonly active = new Map<PowerUpKind, number>();

  /** Starts or refreshes a timed power-up. Instant power-ups are handled by the caller. */
  activate(kind: PowerUpKind, nowMs: number): void {
    const def = POWER_UPS[kind];
    if (def.type !== 'timed') return;
    this.active.set(kind, nowMs + def.durationMs);
  }

  /** Removes expired power-ups. Returns the kinds that expired on this call. */
  update(nowMs: number): PowerUpKind[] {
    const expired: PowerUpKind[] = [];
    for (const [kind, until] of this.active) {
      if (nowMs >= until) {
        this.active.delete(kind);
        expired.push(kind);
      }
    }
    return expired;
  }

  isActive(kind: PowerUpKind, nowMs: number): boolean {
    const until = this.active.get(kind);
    return until !== undefined && nowMs < until;
  }

  /** Consumes an active damage-blocking power-up. Returns true if a hit was blocked. */
  consumeDamageBlock(nowMs: number): boolean {
    for (const kind of this.active.keys()) {
      const def = POWER_UPS[kind];
      if (def.type === 'timed' && def.blocksDamage && this.isActive(kind, nowMs)) {
        this.active.delete(kind);
        return true;
      }
    }
    return false;
  }

  modifiers(nowMs: number): MovementModifiers {
    const result: MovementModifiers = { speedMultiplier: 1, jumpMultiplier: 1 };
    for (const kind of this.active.keys()) {
      const def = POWER_UPS[kind];
      if (def.type !== 'timed' || !this.isActive(kind, nowMs)) continue;
      result.speedMultiplier *= def.modifiers?.speedMultiplier ?? 1;
      result.jumpMultiplier *= def.modifiers?.jumpMultiplier ?? 1;
    }
    return result;
  }

  list(nowMs: number): ActivePowerUp[] {
    const out: ActivePowerUp[] = [];
    for (const [kind, until] of this.active) {
      const def = POWER_UPS[kind];
      if (def.type !== 'timed' || nowMs >= until) continue;
      out.push({ kind, label: def.label, remainingMs: until - nowMs, durationMs: def.durationMs });
    }
    return out;
  }

  clear(): void {
    this.active.clear();
  }
}

/** Returns a movement config with power-up modifiers applied. Returns `base` unchanged when no modifiers apply. */
export function applyModifiers(base: MovementConfig, mods: MovementModifiers): MovementConfig {
  if (mods.speedMultiplier === 1 && mods.jumpMultiplier === 1) return base;
  return {
    ...base,
    maxRunSpeed: base.maxRunSpeed * mods.speedMultiplier,
    groundAcceleration: base.groundAcceleration * mods.speedMultiplier,
    airAcceleration: base.airAcceleration * mods.speedMultiplier,
    jumpVelocity: base.jumpVelocity * mods.jumpMultiplier,
  };
}
