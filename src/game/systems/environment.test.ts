import { describe, expect, it } from 'vitest';
import { MOVEMENT } from '../config/movement';
import {
  ICICLE_REGROW_MS,
  ICICLE_SHAKE_MS,
  IcicleBrain,
  TIMED_BLINK_MS,
  applySurface,
  flamePhase,
  sinkStep,
  timedPhase,
  windForce,
  windPhase,
} from './environment';

describe('sinkStep', () => {
  it('sinks while stood on up to the max drop, then rises when free', () => {
    let offset = 0;
    for (let i = 0; i < 100; i++) offset = sinkStep(offset, true, 100, 64);
    expect(offset).toBe(64);
    for (let i = 0; i < 100; i++) offset = sinkStep(offset, false, 100, 64);
    expect(offset).toBe(0);
  });
});

describe('wind', () => {
  const zone = { id: 'w', x: 0, width: 5, force: -200, periodMs: 5000, activeMs: 1500, warningMs: 1000 };

  it('cycles calm -> warning -> gust', () => {
    expect(windPhase(zone, 0)).toBe('calm');
    expect(windPhase(zone, 2600)).toBe('warning');
    expect(windPhase(zone, 3600)).toBe('gust');
    expect(windForce(zone, 3600)).toBe(-200);
    expect(windForce(zone, 1000)).toBe(0);
  });

  it('always warns before gusting', () => {
    let previous = windPhase(zone, 0);
    for (let t = 0; t < 20_000; t += 10) {
      const phase = windPhase(zone, t);
      if (phase === 'gust' && previous !== 'gust') expect(previous).toBe('warning');
      previous = phase;
    }
  });
});

describe('applySurface', () => {
  it('leaves normal ground unchanged', () => {
    expect(applySurface(MOVEMENT, 'normal')).toBe(MOVEMENT);
  });

  it('makes ice slippery', () => {
    const ice = applySurface(MOVEMENT, 'ice');
    expect(ice.groundDeceleration).toBeLessThan(MOVEMENT.groundDeceleration / 4);
    expect(ice.maxRunSpeed).toBeGreaterThan(MOVEMENT.maxRunSpeed);
    expect(ice.jumpVelocity).toBe(MOVEMENT.jumpVelocity);
  });
});

describe('flame jets and timed platforms', () => {
  it('flame jets warn before firing', () => {
    const jet = { id: 'f', x: 0, y: 0, height: 3, periodMs: 3000, activeMs: 1000, warningMs: 600 };
    expect(flamePhase(jet, 0)).toBe('off');
    expect(flamePhase(jet, 1500)).toBe('warning');
    expect(flamePhase(jet, 2500)).toBe('on');
  });

  it('timed platforms blink before vanishing', () => {
    const p = { id: 't', x: 0, y: 0, width: 3, periodMs: 4000, visibleMs: 2500 };
    expect(timedPhase(p, 0)).toBe('solid');
    expect(timedPhase(p, 2500 - TIMED_BLINK_MS + 1)).toBe('blinking');
    expect(timedPhase(p, 3000)).toBe('gone');
    expect(timedPhase(p, 4000)).toBe('solid');
  });
});

describe('IcicleBrain', () => {
  it('shakes, falls, shatters, and regrows', () => {
    const icicle = new IcicleBrain();
    expect(icicle.update(16, false)).toBeNull();
    expect(icicle.update(16, true)).toBe('shaking');
    expect(icicle.update(ICICLE_SHAKE_MS, false)).toBe('falling');
    icicle.landed();
    expect(icicle.state).toBe('gone');
    expect(icicle.update(ICICLE_REGROW_MS, false)).toBe('hanging');
  });
});
