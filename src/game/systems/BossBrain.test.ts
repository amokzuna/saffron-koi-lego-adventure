import { describe, expect, it } from 'vitest';
import { BossBrain, GUARDIAN_CONFIG, type BossFrame } from './BossBrain';

const frame = (overrides: Partial<BossFrame> = {}): BossFrame => ({ deltaMs: 16, x: 500, playerX: 300, atWallAhead: false, ...overrides });

/** Advances the boss by `ms` in 16 ms steps, returning the last velocity. */
function run(brain: BossBrain, ms: number, overrides: Partial<BossFrame> = {}): number {
  let v = 0;
  for (let t = 0; t < ms; t += 16) v = brain.update(frame(overrides));
  return v;
}

describe('BossBrain', () => {
  it('stays dormant and harmless until activated', () => {
    const brain = new BossBrain();
    expect(run(brain, 5000)).toBe(0);
    expect(brain.state).toBe('dormant');
    expect(brain.touchHurtsPlayer).toBe(false);
  });

  it('walks toward the player, telegraphs, then charges in the locked direction', () => {
    const brain = new BossBrain();
    brain.activate();
    expect(brain.update(frame())).toBe(-GUARDIAN_CONFIG.walkSpeed);
    run(brain, GUARDIAN_CONFIG.walkMs[0]!);
    expect(brain.state).toBe('telegraph');
    // Player moves behind the boss during the telegraph; the charge direction does not change.
    expect(run(brain, 200, { playerX: 900 })).toBe(0);
    run(brain, GUARDIAN_CONFIG.telegraphMs, { playerX: 900 });
    expect(brain.state).toBe('charge');
    expect(brain.update(frame({ playerX: 900 }))).toBe(-GUARDIAN_CONFIG.chargeSpeeds[0]!);
  });

  it('is stunned after charging into a wall, and recovers after the stun window', () => {
    const brain = new BossBrain();
    brain.activate();
    run(brain, GUARDIAN_CONFIG.walkMs[0]! + GUARDIAN_CONFIG.telegraphMs + 32);
    expect(brain.state).toBe('charge');
    brain.update(frame({ atWallAhead: true }));
    expect(brain.state).toBe('stunned');
    expect(brain.touchHurtsPlayer).toBe(false);
    run(brain, GUARDIAN_CONFIG.stunnedMs + 16);
    expect(brain.state).toBe('walk');
  });

  it('only takes damage from stomps while stunned', () => {
    const brain = new BossBrain();
    brain.activate();
    expect(brain.stomp()).toBe('bounced');
    expect(brain.hp).toBe(3);
    brain.state = 'stunned';
    expect(brain.stomp()).toBe('damaged');
    expect(brain.hp).toBe(2);
    expect(brain.state).toBe('hurt');
    expect(brain.stomp()).toBe('bounced');
  });

  it('is defeated after the final hit and its hurt animation', () => {
    const brain = new BossBrain();
    brain.activate();
    for (let i = 0; i < 3; i++) {
      brain.state = 'stunned';
      brain.stomp();
      run(brain, GUARDIAN_CONFIG.hurtMs + 16);
    }
    expect(brain.state).toBe('defeated');
    expect(brain.isActive).toBe(false);
    expect(run(brain, 1000)).toBe(0);
  });

  it('charges faster and telegraphs sooner after taking damage', () => {
    const brain = new BossBrain();
    brain.activate();
    brain.state = 'stunned';
    brain.stomp();
    run(brain, GUARDIAN_CONFIG.hurtMs + 16);
    run(brain, GUARDIAN_CONFIG.walkMs[1]! + 16);
    expect(brain.state).toBe('telegraph');
    run(brain, GUARDIAN_CONFIG.telegraphMs + 16);
    expect(Math.abs(brain.update(frame()))).toBe(GUARDIAN_CONFIG.chargeSpeeds[1]);
  });

  it('reset restores a dormant boss at full health', () => {
    const brain = new BossBrain();
    brain.activate();
    brain.state = 'stunned';
    brain.stomp();
    brain.reset();
    expect(brain.state).toBe('dormant');
    expect(brain.hp).toBe(GUARDIAN_CONFIG.maxHp);
  });
});
