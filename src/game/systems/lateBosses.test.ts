import { describe, expect, it } from 'vitest';
import { FINAL_CONFIG, FinalPhases } from './FinalBrain';
import { FROST_CONFIG, FrostBrain, alternatingZones, type FrostFrame } from './FrostBrain';
import { SENTINEL_CONFIG, SentinelBrain, type SentinelFrame } from './SentinelBrain';

const sFrame = (o: Partial<SentinelFrame> = {}): SentinelFrame => ({
  deltaMs: 16,
  x: 1500,
  playerX: 1300,
  onGround: false,
  atHoverHeight: true,
  arenaMinX: 1000,
  arenaMaxX: 2200,
  ...o,
});

function runSentinel(brain: SentinelBrain, ms: number, o: Partial<SentinelFrame> = {}) {
  const events = [];
  for (let t = 0; t < ms; t += 16) {
    const out = brain.update(sFrame(o));
    if (out.event) events.push(out.event);
  }
  return events;
}

describe('SentinelBrain', () => {
  it('marks boulder targets, then drops them on the markers', () => {
    const brain = new SentinelBrain();
    brain.activate();
    runSentinel(brain, SENTINEL_CONFIG.hoverMs);
    expect(brain.state).toBe('dropTelegraph');
    expect(brain.markers[0]).toBe(1300);
    expect(brain.markers).toHaveLength(SENTINEL_CONFIG.bouldersPerDrop[0]!);
    const marked = [...brain.markers];
    const events = runSentinel(brain, SENTINEL_CONFIG.dropTelegraphMs + 16);
    expect(events).toEqual([{ type: 'boulders', xs: marked }]);
  });

  it('keeps gaps between boulders', () => {
    const brain = new SentinelBrain();
    brain.activate();
    brain.hp = 1;
    runSentinel(brain, SENTINEL_CONFIG.hoverMs);
    const sorted = [...brain.markers].sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i++) expect(sorted[i]! - sorted[i - 1]!).toBeGreaterThanOrEqual(SENTINEL_CONFIG.boulderSpacingPx);
  });

  it('slams after its drops, is stunned and vulnerable on landing, then rises', () => {
    const brain = new SentinelBrain();
    brain.activate();
    for (let i = 0; i < SENTINEL_CONFIG.dropsBeforeSlam[0]!; i++) runSentinel(brain, SENTINEL_CONFIG.hoverMs + SENTINEL_CONFIG.dropTelegraphMs + 32);
    expect(brain.state).toBe('slamTelegraph');
    runSentinel(brain, SENTINEL_CONFIG.slamTelegraphMs + 16);
    expect(brain.state).toBe('slam');
    expect(runSentinel(brain, 16, { onGround: true })).toEqual([{ type: 'landed' }]);
    expect(brain.state).toBe('stunned');
    expect(brain.touchHurtsPlayer).toBe(false);
    expect(brain.stomp()).toBe('damaged');
    runSentinel(brain, SENTINEL_CONFIG.hurtMs + 16, { atHoverHeight: false });
    expect(brain.state).toBe('rise');
  });

  it('only takes damage while stunned', () => {
    const brain = new SentinelBrain();
    brain.activate();
    expect(brain.stomp()).toBe('bounced');
  });
});

const fFrame = (o: Partial<FrostFrame> = {}): FrostFrame => ({ deltaMs: 16, x: 2000, playerX: 1400, arenaMinX: 1000, arenaMaxX: 2600, ...o });
function runFrost(brain: FrostBrain, ms: number) {
  const events = [];
  for (let t = 0; t < ms; t += 16) {
    const out = brain.update(fFrame());
    if (out.event) events.push(out.event);
  }
  return events;
}

describe('FrostBrain', () => {
  it('alternating zones always leave every other segment safe', () => {
    const a = alternatingZones(0, 800, 8, 0);
    const b = alternatingZones(0, 800, 8, 1);
    expect(a).toEqual([[0, 100], [200, 300], [400, 500], [600, 700]]);
    expect(b[0]).toEqual([100, 200]);
  });

  it('telegraphs zones before erupting, alternates them, then rests (vulnerable)', () => {
    const brain = new FrostBrain();
    brain.activate();
    runFrost(brain, FROST_CONFIG.idleMs[0]!);
    expect(brain.state).toBe('telegraph');
    const firstZones = brain.zones;
    const events = runFrost(brain, FROST_CONFIG.telegraphMs[0]! + 16);
    expect(events[0]).toMatchObject({ type: 'erupt', zones: firstZones });
    runFrost(brain, FROST_CONFIG.eruptMs + 16);
    expect(brain.state).toBe('telegraph');
    expect(brain.zones[0]).not.toEqual(firstZones[0]);
    runFrost(brain, FROST_CONFIG.telegraphMs[0]! + FROST_CONFIG.eruptMs + 48);
    expect(brain.state).toBe('exhausted');
    expect(brain.touchHurtsPlayer).toBe(false);
    expect(brain.stomp()).toBe('damaged');
  });
});

describe('FinalPhases', () => {
  it('alternates charge and leap phases and is defeated after the last hit', () => {
    const final = new FinalPhases();
    const modes = [];
    for (let i = 0; i < FINAL_CONFIG.maxHp; i++) {
      modes.push(final.mode);
      final.hit();
    }
    expect(modes).toEqual(['charge', 'leap', 'charge', 'leap']);
    expect(final.defeated).toBe(true);
  });

  it('rains boulders only from the configured phase, on an interval', () => {
    const final = new FinalPhases();
    expect(final.updateRain(FINAL_CONFIG.rainIntervalMs, true)).toBe(false);
    final.hit();
    final.hit();
    expect(final.updateRain(FINAL_CONFIG.rainIntervalMs - 1, true)).toBe(false);
    expect(final.updateRain(1, true)).toBe(true);
    expect(final.updateRain(FINAL_CONFIG.rainIntervalMs, false)).toBe(false);
  });
});
