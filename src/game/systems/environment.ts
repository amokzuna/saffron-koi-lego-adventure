import type { MovementConfig } from '../config/movement';
import type { FlameJetPlacement, TimedPlatformPlacement, WindZonePlacement } from '../levels/types';

/**
 * Pure timing and physics helpers for environmental mechanics (Worlds 3–5).
 * Everything is driven by the game clock so it pauses with the game and is unit-testable.
 */

const cycle = (clockMs: number, periodMs: number, phaseMs = 0) => (((clockMs + phaseMs) % periodMs) + periodMs) % periodMs;

// ---------- Sinking sand ----------

export const SINK_SPEED = 45; // px/s while stood on
export const RISE_SPEED = 30; // px/s when free

/** New sink offset (px, 0 = original height) after deltaMs. */
export function sinkStep(offsetPx: number, standing: boolean, deltaMs: number, maxDropPx: number): number {
  const dt = deltaMs / 1000;
  return standing ? Math.min(maxDropPx, offsetPx + SINK_SPEED * dt) : Math.max(0, offsetPx - RISE_SPEED * dt);
}

// ---------- Wind ----------

export type WindPhase = 'calm' | 'warning' | 'gust';

/** Gust cycle: calm, then warningMs of visible streaks, then activeMs of push. */
export function windPhase(zone: WindZonePlacement, clockMs: number): WindPhase {
  const t = cycle(clockMs, zone.periodMs, zone.phaseMs);
  const gustStart = zone.periodMs - zone.activeMs;
  if (t >= gustStart) return 'gust';
  if (t >= gustStart - zone.warningMs) return 'warning';
  return 'calm';
}

export function windForce(zone: WindZonePlacement, clockMs: number): number {
  return windPhase(zone, clockMs) === 'gust' ? zone.force : 0;
}

// ---------- Surfaces ----------

export type SurfaceKind = 'normal' | 'ice';

/** Ice keeps momentum: much weaker acceleration/deceleration on the ground, slightly higher top speed. */
export function applySurface(config: MovementConfig, surface: SurfaceKind): MovementConfig {
  if (surface !== 'ice') return config;
  return {
    ...config,
    maxRunSpeed: config.maxRunSpeed * 1.15,
    groundAcceleration: config.groundAcceleration * 0.25,
    groundDeceleration: config.groundDeceleration * 0.12,
  };
}

export const BOOST_SPEED = 460;
/** Time after a boost during which the player keeps the boosted speed cap. */
export const BOOST_DURATION_MS = 900;

// ---------- Flame jets ----------

export type FlamePhase = 'off' | 'warning' | 'on';

export function flamePhase(jet: FlameJetPlacement, clockMs: number): FlamePhase {
  const t = cycle(clockMs, jet.periodMs, jet.phaseMs);
  const onStart = jet.periodMs - jet.activeMs;
  if (t >= onStart) return 'on';
  if (t >= onStart - jet.warningMs) return 'warning';
  return 'off';
}

// ---------- Timed platforms ----------

export type TimedPhase = 'solid' | 'blinking' | 'gone';
/** Platforms blink for this long before vanishing. */
export const TIMED_BLINK_MS = 700;

export function timedPhase(p: TimedPlatformPlacement, clockMs: number): TimedPhase {
  const t = cycle(clockMs, p.periodMs, p.phaseMs);
  if (t >= p.visibleMs) return 'gone';
  if (t >= p.visibleMs - TIMED_BLINK_MS) return 'blinking';
  return 'solid';
}

// ---------- Icicles ----------

export type IcicleState = 'hanging' | 'shaking' | 'falling' | 'gone';

export const ICICLE_SHAKE_MS = 600;
export const ICICLE_REGROW_MS = 3000;
/** Horizontal distance (px) from the icicle at which a passing player triggers it. */
export const ICICLE_TRIGGER_PX = 56;

/** Icicle state machine: hanging -> (player beneath) shaking -> falling -> (hits ground) gone -> regrow. */
export class IcicleBrain {
  state: IcicleState = 'hanging';
  private timerMs = 0;

  update(deltaMs: number, playerBeneath: boolean): IcicleState | null {
    this.timerMs += deltaMs;
    if (this.state === 'hanging' && playerBeneath) return this.enter('shaking');
    if (this.state === 'shaking' && this.timerMs >= ICICLE_SHAKE_MS) return this.enter('falling');
    if (this.state === 'gone' && this.timerMs >= ICICLE_REGROW_MS) return this.enter('hanging');
    return null;
  }

  landed(): void {
    if (this.state === 'falling') this.enter('gone');
  }

  private enter(state: IcicleState): IcicleState {
    this.state = state;
    this.timerMs = 0;
    return state;
  }
}
