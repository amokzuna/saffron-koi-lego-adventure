import { describe, expect, it } from 'vitest';
import { HealthSystem } from './HealthSystem';

describe('HealthSystem', () => {
  it('loses one heart per hit and grants invulnerability', () => {
    const health = new HealthSystem(3, 1000);
    expect(health.damage(0)).toBe('hurt');
    expect(health.current).toBe(2);
    expect(health.damage(500)).toBe('ignored');
    expect(health.current).toBe(2);
    expect(health.damage(1000)).toBe('hurt');
    expect(health.current).toBe(1);
  });

  it('reports death at zero hearts and ignores further damage', () => {
    const health = new HealthSystem(1, 1000);
    expect(health.damage(0)).toBe('dead');
    expect(health.isDead).toBe(true);
    expect(health.damage(5000)).toBe('ignored');
    expect(health.current).toBe(0);
  });

  it('forced damage bypasses invulnerability', () => {
    const health = new HealthSystem(3, 1000);
    health.damage(0);
    expect(health.damage(10, { force: true })).toBe('hurt');
    expect(health.current).toBe(1);
  });

  it('heals up to the maximum only', () => {
    const health = new HealthSystem(3, 1000);
    expect(health.heal(1)).toBe(0);
    health.damage(0);
    expect(health.heal(5)).toBe(1);
    expect(health.current).toBe(3);
  });

  it('reset restores full hearts with invulnerability', () => {
    const health = new HealthSystem(3, 1000);
    health.damage(0, { force: true });
    health.damage(0, { force: true });
    health.damage(0, { force: true });
    health.reset(2000);
    expect(health.current).toBe(3);
    expect(health.isInvulnerable(2500)).toBe(true);
  });
});
