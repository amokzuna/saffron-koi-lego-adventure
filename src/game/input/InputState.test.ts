import { describe, expect, it } from 'vitest';
import { InputCombiner, emptyControls } from './InputState';

describe('InputCombiner', () => {
  it('merges keyboard and touch sources', () => {
    const combiner = new InputCombiner();
    const frame = combiner.next({ ...emptyControls(), right: true }, { ...emptyControls(), jump: true });
    expect(frame).toEqual({ direction: 1, jumpHeld: true, jumpPressed: true });
  });

  it('cancels out opposing directions', () => {
    const combiner = new InputCombiner();
    expect(combiner.next({ left: true, right: true, jump: false }).direction).toBe(0);
  });

  it('reports jumpPressed only on the first held frame', () => {
    const combiner = new InputCombiner();
    const held = { ...emptyControls(), jump: true };
    expect(combiner.next(held).jumpPressed).toBe(true);
    expect(combiner.next(held).jumpPressed).toBe(false);
    combiner.next(emptyControls());
    expect(combiner.next(held).jumpPressed).toBe(true);
  });
});
