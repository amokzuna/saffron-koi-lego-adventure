import { describe, expect, it } from 'vitest';
import { MUSIC, SOUNDS, midiToFrequency, musicFor, soundDuration } from './sounds';

describe('sound definitions', () => {
  it('converts MIDI notes to frequencies', () => {
    expect(midiToFrequency(69)).toBe(440);
    expect(midiToFrequency(81)).toBeCloseTo(880);
    expect(midiToFrequency(60)).toBeCloseTo(261.63, 1);
  });

  it('every sound has audible, short tones', () => {
    for (const tones of Object.values(SOUNDS)) {
      expect(tones.length).toBeGreaterThan(0);
      for (const t of tones) {
        expect(t.gain).toBeGreaterThan(0);
        expect(t.gain).toBeLessThanOrEqual(0.3);
        expect(t.at + t.duration).toBeLessThan(1.5);
      }
    }
  });

  it('the fall sound is a falling glide, distinct from the hurt sound', () => {
    const fall = SOUNDS.fall;
    const glides = fall.filter((t) => t.to < t.from);
    expect(glides.length).toBeGreaterThanOrEqual(3);
    // Overall pitch drops by more than two octaves across the glide.
    expect(fall[0]!.from / Math.min(...glides.map((t) => t.to))).toBeGreaterThan(4);
    expect(fall).not.toEqual(SOUNDS.hurt);
    expect(soundDuration('fall')).toBeCloseTo(1.04, 2);
  });

  it('has a 16-step loop for each of the five worlds and a fallback', () => {
    for (const world of [1, 2, 3, 4, 5]) {
      expect(MUSIC[world]!.melody).toHaveLength(16);
      expect(MUSIC[world]!.bass).toHaveLength(16);
    }
    expect(musicFor(0)).toBe(MUSIC[1]);
  });
});
