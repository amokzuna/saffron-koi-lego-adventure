import { describe, expect, it } from 'vitest';
import { MOVEMENT } from '../config/movement';
import { initialJumpState, maxJumpHeight, nextHorizontalVelocity, updateJump, type JumpInput } from './movement';

const frame = (overrides: Partial<JumpInput> = {}): JumpInput => ({
  jumpPressed: false,
  jumpHeld: false,
  onGround: true,
  verticalVelocity: 0,
  deltaMs: 16,
  ...overrides,
});

describe('nextHorizontalVelocity', () => {
  it('accelerates toward max speed without exceeding it', () => {
    let v = 0;
    for (let i = 0; i < 120; i++) v = nextHorizontalVelocity(v, 1, true, 16, MOVEMENT);
    expect(v).toBe(MOVEMENT.maxRunSpeed);
  });

  it('decelerates to a full stop with no input', () => {
    let v = MOVEMENT.maxRunSpeed;
    for (let i = 0; i < 120; i++) v = nextHorizontalVelocity(v, 0, true, 16, MOVEMENT);
    expect(v).toBe(0);
  });

  it('turns around faster than it accelerates from rest', () => {
    const fromRest = Math.abs(nextHorizontalVelocity(0, -1, true, 16, MOVEMENT));
    const turnDelta = MOVEMENT.maxRunSpeed - nextHorizontalVelocity(MOVEMENT.maxRunSpeed, -1, true, 16, MOVEMENT);
    expect(turnDelta).toBeGreaterThan(fromRest);
  });
});

describe('updateJump', () => {
  it('jumps immediately when pressed on the ground', () => {
    const result = updateJump(initialJumpState(), frame({ jumpPressed: true, jumpHeld: true }), MOVEMENT);
    expect(result.action).toBe('jump');
  });

  it('allows a jump within coyote time after leaving a ledge', () => {
    let { state } = updateJump(initialJumpState(), frame(), MOVEMENT);
    ({ state } = updateJump(state, frame({ onGround: false, deltaMs: 50 }), MOVEMENT));
    const result = updateJump(state, frame({ onGround: false, jumpPressed: true, jumpHeld: true, deltaMs: 16 }), MOVEMENT);
    expect(result.action).toBe('jump');
  });

  it('rejects a jump after coyote time expires', () => {
    let { state } = updateJump(initialJumpState(), frame(), MOVEMENT);
    ({ state } = updateJump(state, frame({ onGround: false, deltaMs: MOVEMENT.coyoteTimeMs + 10 }), MOVEMENT));
    const result = updateJump(state, frame({ onGround: false, jumpPressed: true, jumpHeld: true }), MOVEMENT);
    expect(result.action).toBe('none');
  });

  it('buffers a jump pressed shortly before landing', () => {
    let { state } = updateJump(initialJumpState(), frame({ onGround: false }), MOVEMENT);
    ({ state } = updateJump(state, frame({ onGround: false, jumpPressed: true, jumpHeld: true, verticalVelocity: 300 }), MOVEMENT));
    const result = updateJump(state, frame({ onGround: true, jumpHeld: true, deltaMs: 40 }), MOVEMENT);
    expect(result.action).toBe('jump');
  });

  it('does not double jump in mid-air', () => {
    let { state } = updateJump(initialJumpState(), frame({ jumpPressed: true, jumpHeld: true }), MOVEMENT);
    ({ state } = updateJump(state, frame({ onGround: false, jumpHeld: false, verticalVelocity: -400 }), MOVEMENT));
    const result = updateJump(state, frame({ onGround: false, jumpPressed: true, jumpHeld: true, verticalVelocity: -300 }), MOVEMENT);
    expect(result.action).toBe('none');
  });

  it('cuts the jump short when released while rising', () => {
    const { state } = updateJump(initialJumpState(), frame({ jumpPressed: true, jumpHeld: true }), MOVEMENT);
    const result = updateJump(state, frame({ onGround: false, jumpHeld: false, verticalVelocity: -500 }), MOVEMENT);
    expect(result.action).toBe('cut');
    const after = updateJump(result.state, frame({ onGround: false, jumpHeld: false, verticalVelocity: -200 }), MOVEMENT);
    expect(after.action).toBe('none');
  });
});

describe('maxJumpHeight', () => {
  it('lets the player clear at least three tiles', () => {
    expect(maxJumpHeight(MOVEMENT)).toBeGreaterThan(3 * 32);
  });
});
