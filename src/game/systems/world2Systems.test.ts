import { describe, expect, it } from 'vitest';
import { CrumbleTile } from './crumble';
import { HopTimer } from './hopper';
import { PROTECTOR_CONFIG, ProtectorBrain, type ProtectorFrame } from './ProtectorBrain';

describe('HopTimer', () => {
  it('hops after resting on the ground for the interval', () => {
    const timer = new HopTimer(1000);
    expect(timer.update(600, true)).toBe(false);
    expect(timer.update(400, true)).toBe(true);
    expect(timer.update(16, true)).toBe(false);
  });

  it('does not count airborne time', () => {
    const timer = new HopTimer(1000);
    timer.update(900, true);
    expect(timer.update(5000, false)).toBe(false);
    expect(timer.update(100, true)).toBe(true);
  });

  it('supports a phase offset', () => {
    expect(new HopTimer(1000, 900).update(100, true)).toBe(true);
  });
});

describe('CrumbleTile', () => {
  it('shakes when touched, falls, then respawns', () => {
    const tile = new CrumbleTile({ shakeMs: 400, respawnMs: 2000 });
    expect(tile.update(1000, false)).toBeNull();
    tile.touch();
    expect(tile.state).toBe('shaking');
    expect(tile.isSolid).toBe(true);
    expect(tile.update(400, false)).toBe('fallen');
    expect(tile.isSolid).toBe(false);
    expect(tile.update(1999, false)).toBeNull();
    expect(tile.update(1, false)).toBe('solid');
  });

  it('waits to respawn while the space is occupied', () => {
    const tile = new CrumbleTile({ shakeMs: 100, respawnMs: 100 });
    tile.touch();
    tile.update(100, false);
    expect(tile.update(500, true)).toBeNull();
    expect(tile.state).toBe('fallen');
    expect(tile.update(16, false)).toBe('solid');
  });

  it('ignores touches while already shaking', () => {
    const tile = new CrumbleTile({ shakeMs: 400, respawnMs: 100 });
    tile.touch();
    tile.update(300, false);
    tile.touch();
    expect(tile.update(100, false)).toBe('fallen');
  });
});

const ARENA = { arenaMinX: 1000, arenaMaxX: 2000 };
const frame = (overrides: Partial<ProtectorFrame> = {}): ProtectorFrame => ({
  deltaMs: 16,
  x: 1800,
  playerX: 1300,
  onGround: true,
  ...ARENA,
  ...overrides,
});

function advance(brain: ProtectorBrain, ms: number, overrides: Partial<ProtectorFrame> = {}) {
  const commands = [];
  for (let t = 0; t < ms; t += 16) {
    const c = brain.update(frame(overrides));
    if (c.type !== 'none') commands.push(c);
  }
  return commands;
}

describe('ProtectorBrain', () => {
  it('telegraphs at the player position, then leaps there', () => {
    const brain = new ProtectorBrain();
    brain.activate();
    advance(brain, PROTECTOR_CONFIG.idleMs[0]!);
    expect(brain.state).toBe('telegraph');
    expect(brain.targetX).toBe(1300);
    expect(brain.showsTarget).toBe(true);
    // The target stays locked even if the player moves during the telegraph.
    const commands = advance(brain, PROTECTOR_CONFIG.telegraphMs + 16, { playerX: 1600 });
    expect(commands).toEqual([{ type: 'leap', targetX: 1300, durationMs: PROTECTOR_CONFIG.leapDurationMs }]);
    expect(brain.state).toBe('leap');
  });

  it('keeps targets away from the arena walls', () => {
    const brain = new ProtectorBrain();
    brain.activate();
    advance(brain, PROTECTOR_CONFIG.idleMs[0]!, { playerX: 900 });
    expect(brain.targetX).toBe(ARENA.arenaMinX + PROTECTOR_CONFIG.edgeMarginPx);
  });

  it('lands, sends shockwaves, and gets stuck (vulnerable, harmless)', () => {
    const brain = new ProtectorBrain();
    brain.activate();
    advance(brain, PROTECTOR_CONFIG.idleMs[0]! + PROTECTOR_CONFIG.telegraphMs + 32);
    expect(brain.state).toBe('leap');
    advance(brain, 300, { onGround: false });
    const commands = advance(brain, 16);
    expect(commands).toEqual([{ type: 'land', shockwaveSpeed: PROTECTOR_CONFIG.shockwaveSpeeds[0] }]);
    expect(brain.state).toBe('stuck');
    expect(brain.touchHurtsPlayer).toBe(false);
    expect(brain.stomp()).toBe('damaged');
    expect(brain.hp).toBe(2);
  });

  it('ignores stomps when not stuck', () => {
    const brain = new ProtectorBrain();
    brain.activate();
    expect(brain.stomp()).toBe('bounced');
    expect(brain.hp).toBe(PROTECTOR_CONFIG.maxHp);
  });

  it('chains two leaps in the final phase', () => {
    const brain = new ProtectorBrain();
    brain.activate();
    brain.hp = 1;
    advance(brain, PROTECTOR_CONFIG.idleMs[2]! + PROTECTOR_CONFIG.telegraphMs + 32);
    advance(brain, 300, { onGround: false });
    advance(brain, 16);
    expect(brain.state).toBe('telegraph');
  });

  it('is defeated after the last hit and hurt window', () => {
    const brain = new ProtectorBrain();
    brain.activate();
    brain.hp = 1;
    brain.state = 'stuck';
    brain.stomp();
    advance(brain, PROTECTOR_CONFIG.hurtMs + 16);
    expect(brain.state).toBe('defeated');
  });
});
