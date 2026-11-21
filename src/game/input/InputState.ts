import type { Direction } from '../systems/movement';

/** Raw held-button state from one input source. */
export interface ControlState {
  left: boolean;
  right: boolean;
  jump: boolean;
}

export const emptyControls = (): ControlState => ({ left: false, right: false, jump: false });

/**
 * Mutable control state written by React's on-screen touch buttons and read by Phaser each frame.
 * Kept as a plain object so the scene can poll it without event overhead.
 */
export class VirtualControls {
  state: ControlState = emptyControls();

  set(control: keyof ControlState, held: boolean): void {
    this.state[control] = held;
  }

  releaseAll(): void {
    this.state = emptyControls();
  }
}

export interface FrameInput {
  direction: Direction;
  jumpHeld: boolean;
  /** True only on the frame jump went from released to held. */
  jumpPressed: boolean;
}

/** Merges input sources into a single per-frame input, with jump edge detection. */
export class InputCombiner {
  private previousJumpHeld = false;

  next(...sources: readonly ControlState[]): FrameInput {
    const left = sources.some((s) => s.left);
    const right = sources.some((s) => s.right);
    const jumpHeld = sources.some((s) => s.jump);
    const jumpPressed = jumpHeld && !this.previousJumpHeld;
    this.previousJumpHeld = jumpHeld;
    const direction: Direction = left === right ? 0 : left ? -1 : 1;
    return { direction, jumpHeld, jumpPressed };
  }

  reset(): void {
    this.previousJumpHeld = false;
  }
}
