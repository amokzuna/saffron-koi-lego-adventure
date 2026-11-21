import { describe, expect, it } from 'vitest';
import { MOVEMENT } from '../config/movement';
import { POWER_UPS, PowerUpSystem, applyModifiers } from './powerUps';

describe('PowerUpSystem', () => {
  it('activates timed power-ups and expires them after their duration', () => {
    const system = new PowerUpSystem();
    system.activate('speedBoost', 0);
    expect(system.isActive('speedBoost', 100)).toBe(true);
    expect(system.update(POWER_UPS.speedBoost.type === 'timed' ? POWER_UPS.speedBoost.durationMs : 0)).toEqual(['speedBoost']);
    expect(system.isActive('speedBoost', 8001)).toBe(false);
  });

  it('refreshes duration when re-collected instead of stacking', () => {
    const system = new PowerUpSystem();
    system.activate('superJump', 0);
    system.activate('superJump', 5000);
    const [entry] = system.list(5000);
    expect(entry?.remainingMs).toBe(10_000);
    expect(system.modifiers(5000).jumpMultiplier).toBe(1.25);
  });

  it('combines modifiers from different power-ups', () => {
    const system = new PowerUpSystem();
    system.activate('superJump', 0);
    system.activate('speedBoost', 0);
    expect(system.modifiers(10)).toEqual({ speedMultiplier: 1.4, jumpMultiplier: 1.25 });
  });

  it('ignores instant power-ups', () => {
    const system = new PowerUpSystem();
    system.activate('extraHeart', 0);
    expect(system.list(0)).toEqual([]);
  });

  it('shield blocks one hit then ends', () => {
    const system = new PowerUpSystem();
    system.activate('shield', 0);
    expect(system.consumeDamageBlock(100)).toBe(true);
    expect(system.consumeDamageBlock(200)).toBe(false);
    expect(system.isActive('shield', 200)).toBe(false);
  });

  it('expired shield does not block', () => {
    const system = new PowerUpSystem();
    system.activate('shield', 0);
    expect(system.consumeDamageBlock(12_000)).toBe(false);
  });
});

describe('applyModifiers', () => {
  it('returns the base config when nothing is active', () => {
    expect(applyModifiers(MOVEMENT, { speedMultiplier: 1, jumpMultiplier: 1 })).toBe(MOVEMENT);
  });

  it('scales speed and jump', () => {
    const config = applyModifiers(MOVEMENT, { speedMultiplier: 2, jumpMultiplier: 1.5 });
    expect(config.maxRunSpeed).toBe(MOVEMENT.maxRunSpeed * 2);
    expect(config.jumpVelocity).toBe(MOVEMENT.jumpVelocity * 1.5);
    expect(config.gravity).toBe(MOVEMENT.gravity);
  });
});
