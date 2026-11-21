import type { MovementConfig } from '../config/movement';

/** -1 = left, 0 = none, 1 = right */
export type Direction = -1 | 0 | 1;

function approach(current: number, target: number, maxDelta: number): number {
  if (current < target) return Math.min(current + maxDelta, target);
  if (current > target) return Math.max(current - maxDelta, target);
  return target;
}

/** Accelerates horizontal velocity toward the input direction, with separate ground/air handling. */
export function nextHorizontalVelocity(
  currentVelocity: number,
  direction: Direction,
  onGround: boolean,
  deltaMs: number,
  config: MovementConfig,
): number {
  const dt = deltaMs / 1000;
  const target = direction * config.maxRunSpeed;
  const turning = direction !== 0 && Math.sign(currentVelocity) === -direction;
  let rate: number;
  if (direction === 0) {
    rate = onGround ? config.groundDeceleration : config.airDeceleration;
  } else if (turning) {
    // Turning around uses the stronger of accel/decel so direction changes feel responsive.
    rate = onGround
      ? Math.max(config.groundAcceleration, config.groundDeceleration)
      : Math.max(config.airAcceleration, config.airDeceleration);
  } else {
    rate = onGround ? config.groundAcceleration : config.airAcceleration;
  }
  return approach(currentVelocity, target, rate * dt);
}

export interface JumpState {
  /** Remaining coyote time in ms (time since leaving ground during which jumping is allowed). */
  coyoteMs: number;
  /** Remaining buffered jump time in ms. */
  bufferMs: number;
  /** True while the current jump is still rising under player control (eligible for jump cut). */
  rising: boolean;
}

export const initialJumpState = (): JumpState => ({ coyoteMs: 0, bufferMs: 0, rising: false });

export interface JumpInput {
  /** Jump was pressed this frame (edge, not held). */
  jumpPressed: boolean;
  jumpHeld: boolean;
  onGround: boolean;
  verticalVelocity: number;
  deltaMs: number;
}

export type JumpAction = 'jump' | 'cut' | 'none';

/**
 * Advances jump timers and decides whether to start a jump or cut one short.
 * Pure function so jump feel (coyote time, buffering, variable height) is unit-testable.
 */
export function updateJump(
  state: JumpState,
  input: JumpInput,
  config: MovementConfig,
): { state: JumpState; action: JumpAction } {
  let coyoteMs = input.onGround ? config.coyoteTimeMs : Math.max(0, state.coyoteMs - input.deltaMs);
  let bufferMs = input.jumpPressed ? config.jumpBufferMs : Math.max(0, state.bufferMs - input.deltaMs);
  let rising = state.rising && input.verticalVelocity < 0;

  if (bufferMs > 0 && coyoteMs > 0) {
    return { state: { coyoteMs: 0, bufferMs: 0, rising: true }, action: 'jump' };
  }

  if (rising && !input.jumpHeld) {
    rising = false;
    return { state: { coyoteMs, bufferMs, rising }, action: 'cut' };
  }

  return { state: { coyoteMs, bufferMs, rising }, action: 'none' };
}

/** Peak jump height in px for a given config, useful for level design validation. */
export function maxJumpHeight(config: MovementConfig): number {
  return (config.jumpVelocity * config.jumpVelocity) / (2 * config.gravity);
}
