/**
 * Original sound design, generated with the Web Audio API (no audio files). Pure data + helpers here;
 * playback lives in AudioEngine.
 */
export type SoundId =
  | 'jump'
  | 'coin'
  | 'brick'
  | 'stomp'
  | 'hurt'
  | 'powerUp'
  | 'checkpoint'
  | 'bossHit'
  | 'levelComplete'
  | 'gameOver'
  | 'door'
  | 'boom'
  | 'fall';

export interface Tone {
  wave: OscillatorType;
  /** Start and end frequency (Hz) — a glide when they differ. */
  from: number;
  to: number;
  /** Start offset and duration in seconds. */
  at: number;
  duration: number;
  gain: number;
}

export const SOUNDS: Readonly<Record<SoundId, Tone[]>> = {
  jump: [{ wave: 'square', from: 330, to: 660, at: 0, duration: 0.12, gain: 0.18 }],
  coin: [
    { wave: 'square', from: 988, to: 988, at: 0, duration: 0.06, gain: 0.14 },
    { wave: 'square', from: 1319, to: 1319, at: 0.06, duration: 0.12, gain: 0.14 },
  ],
  brick: [
    { wave: 'triangle', from: 523, to: 523, at: 0, duration: 0.09, gain: 0.25 },
    { wave: 'triangle', from: 659, to: 659, at: 0.09, duration: 0.09, gain: 0.25 },
    { wave: 'triangle', from: 784, to: 784, at: 0.18, duration: 0.09, gain: 0.25 },
    { wave: 'triangle', from: 1047, to: 1047, at: 0.27, duration: 0.2, gain: 0.25 },
  ],
  stomp: [{ wave: 'square', from: 220, to: 80, at: 0, duration: 0.12, gain: 0.22 }],
  hurt: [{ wave: 'sawtooth', from: 400, to: 120, at: 0, duration: 0.3, gain: 0.2 }],
  powerUp: [
    { wave: 'triangle', from: 392, to: 784, at: 0, duration: 0.15, gain: 0.22 },
    { wave: 'triangle', from: 523, to: 1047, at: 0.15, duration: 0.2, gain: 0.22 },
  ],
  checkpoint: [
    { wave: 'sine', from: 660, to: 660, at: 0, duration: 0.1, gain: 0.25 },
    { wave: 'sine', from: 880, to: 880, at: 0.1, duration: 0.18, gain: 0.25 },
  ],
  bossHit: [
    { wave: 'square', from: 160, to: 60, at: 0, duration: 0.25, gain: 0.3 },
    { wave: 'triangle', from: 880, to: 440, at: 0.05, duration: 0.2, gain: 0.15 },
  ],
  levelComplete: [
    { wave: 'square', from: 523, to: 523, at: 0, duration: 0.12, gain: 0.16 },
    { wave: 'square', from: 659, to: 659, at: 0.12, duration: 0.12, gain: 0.16 },
    { wave: 'square', from: 784, to: 784, at: 0.24, duration: 0.12, gain: 0.16 },
    { wave: 'square', from: 1047, to: 1047, at: 0.36, duration: 0.4, gain: 0.16 },
    { wave: 'triangle', from: 262, to: 262, at: 0.36, duration: 0.4, gain: 0.2 },
  ],
  gameOver: [
    { wave: 'triangle', from: 392, to: 392, at: 0, duration: 0.2, gain: 0.22 },
    { wave: 'triangle', from: 330, to: 330, at: 0.2, duration: 0.2, gain: 0.22 },
    { wave: 'triangle', from: 262, to: 196, at: 0.4, duration: 0.5, gain: 0.22 },
  ],
  door: [{ wave: 'sawtooth', from: 90, to: 140, at: 0, duration: 0.35, gain: 0.15 }],
  boom: [{ wave: 'sawtooth', from: 120, to: 40, at: 0, duration: 0.3, gain: 0.22 }],
  /**
   * Falling into a pit or lava: an original slide-whistle drop (one long descending glide with a wobble),
   * then a soft low "bump" and a short rising "oops" chirp. Evokes classic platformer falls without
   * borrowing any existing melody.
   */
  fall: [
    { wave: 'triangle', from: 1180, to: 820, at: 0, duration: 0.18, gain: 0.2 },
    { wave: 'triangle', from: 900, to: 600, at: 0.16, duration: 0.18, gain: 0.2 },
    { wave: 'triangle', from: 660, to: 170, at: 0.32, duration: 0.42, gain: 0.2 },
    { wave: 'square', from: 110, to: 70, at: 0.76, duration: 0.14, gain: 0.18 },
    { wave: 'sine', from: 330, to: 440, at: 0.92, duration: 0.12, gain: 0.14 },
  ],
};

/** Total length of a sound in seconds (used to sequence follow-up sounds). */
export function soundDuration(id: SoundId): number {
  return Math.max(...SOUNDS[id].map((t) => t.at + t.duration));
}

/** Equal-tempered frequency for a MIDI note number (69 = A4 = 440 Hz). */
export function midiToFrequency(note: number): number {
  return 440 * 2 ** ((note - 69) / 12);
}

export interface MusicTrack {
  bpm: number;
  wave: OscillatorType;
  /** 16 steps of eighth notes; MIDI note numbers, null = rest. */
  melody: (number | null)[];
  bass: (number | null)[];
}

const _ = null;

/** One short, original loop per world (plus a calm menu-free default). */
export const MUSIC: Readonly<Record<number, MusicTrack>> = {
  1: { bpm: 132, wave: 'square', melody: [72, _, 76, 79, _, 76, 74, _, 72, _, 74, 76, 77, 76, 74, _], bass: [48, _, 55, _, 48, _, 55, _, 53, _, 60, _, 55, _, 50, _] },
  2: { bpm: 112, wave: 'triangle', melody: [69, 72, _, 76, 74, _, 72, _, 67, 69, _, 72, 71, _, 69, _], bass: [45, _, 52, _, 45, _, 52, _, 43, _, 50, _, 45, _, 52, _] },
  3: { bpm: 120, wave: 'square', melody: [74, _, 75, 78, _, 75, 74, _, 71, _, 74, _, 75, 74, 71, _], bass: [50, _, 50, _, 57, _, 50, _, 55, _, 55, _, 57, _, 50, _] },
  4: { bpm: 100, wave: 'triangle', melody: [76, _, 79, _, 83, _, 81, 79, 76, _, 74, _, 76, _, _, _], bass: [52, _, _, _, 59, _, _, _, 57, _, _, _, 52, _, _, _] },
  5: { bpm: 144, wave: 'sawtooth', melody: [69, 69, _, 72, _, 69, 74, _, 69, 69, _, 75, _, 74, 72, _], bass: [45, _, 45, _, 45, _, 48, _, 45, _, 45, _, 51, _, 50, _] },
};

export const MUSIC_WORLDS = Object.keys(MUSIC).map(Number);

/** Track for a world, falling back to World 1's (e.g. for developer levels). */
export function musicFor(worldId: number): MusicTrack {
  return MUSIC[worldId] ?? MUSIC[1]!;
}
