/**
 * Central player movement tuning. All velocities are px/s, accelerations px/s², times in ms.
 * Keep gameplay feel adjustments here rather than scattered through entity code.
 */
export interface MovementConfig {
  gravity: number;
  maxRunSpeed: number;
  groundAcceleration: number;
  groundDeceleration: number;
  airAcceleration: number;
  airDeceleration: number;
  jumpVelocity: number;
  /** Upward velocity is multiplied by this when jump is released early (variable jump height). */
  jumpCutMultiplier: number;
  maxFallSpeed: number;
  /** Grace period after leaving a ledge during which a jump is still allowed. */
  coyoteTimeMs: number;
  /** A jump pressed this long before landing is executed on landing. */
  jumpBufferMs: number;
}

export const MOVEMENT: MovementConfig = {
  gravity: 1500,
  maxRunSpeed: 250,
  groundAcceleration: 2200,
  groundDeceleration: 2600,
  airAcceleration: 1500,
  airDeceleration: 900,
  jumpVelocity: 640,
  jumpCutMultiplier: 0.45,
  maxFallSpeed: 900,
  coyoteTimeMs: 100,
  jumpBufferMs: 120,
};
