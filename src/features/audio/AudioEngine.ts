import { SOUNDS, midiToFrequency, musicFor, type MusicTrack, type SoundId } from './sounds';

export interface VolumeSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  muted: boolean;
}

const LOOKAHEAD_S = 0.12;
const SCHEDULE_INTERVAL_MS = 30;

/**
 * Web Audio playback for generated sound effects and looping music. The AudioContext is created on the
 * first user gesture (browsers block audio before that); every method is a safe no-op without audio support.
 */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private music: GainNode | null = null;
  private sfx: GainNode | null = null;
  private volumes: VolumeSettings = { masterVolume: 0.8, musicVolume: 0.5, sfxVolume: 0.8, muted: false };
  private track: MusicTrack | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private nextStepTime = 0;
  private step = 0;
  private ducked = false;

  /** Call from a user gesture (click/tap/key). */
  unlock(): void {
    if (typeof window === 'undefined') return;
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    try {
      if (!this.ctx) {
        this.ctx = new Ctor();
        this.master = this.ctx.createGain();
        this.music = this.ctx.createGain();
        this.sfx = this.ctx.createGain();
        this.music.connect(this.master);
        this.sfx.connect(this.master);
        this.master.connect(this.ctx.destination);
        this.applyVolumes();
      }
      if (this.ctx.state === 'suspended') void this.ctx.resume();
    } catch {
      this.ctx = null;
    }
  }

  setVolumes(volumes: VolumeSettings): void {
    this.volumes = volumes;
    this.applyVolumes();
  }

  private applyVolumes(): void {
    if (!this.ctx || !this.master || !this.music || !this.sfx) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(this.volumes.muted ? 0 : this.volumes.masterVolume, t, 0.02);
    this.music.gain.setTargetAtTime(this.volumes.musicVolume * (this.ducked ? 0.35 : 1) * 0.5, t, 0.05);
    this.sfx.gain.setTargetAtTime(this.volumes.sfxVolume, t, 0.02);
  }

  play(id: SoundId): void {
    const ctx = this.ctx;
    if (!ctx || !this.sfx || ctx.state !== 'running') return;
    const start = ctx.currentTime;
    for (const tone of SOUNDS[id]) this.tone(this.sfx, tone.wave, tone.from, tone.to, start + tone.at, tone.duration, tone.gain);
  }

  private tone(dest: AudioNode, wave: OscillatorType, from: number, to: number, at: number, duration: number, gain: number): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(from, at);
    if (to !== from) osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), at + duration);
    env.gain.setValueAtTime(0, at);
    env.gain.linearRampToValueAtTime(gain, at + 0.01);
    env.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    osc.connect(env).connect(dest);
    osc.start(at);
    osc.stop(at + duration + 0.02);
  }

  /** Starts (or switches to) the world's music loop. */
  startMusic(worldId: number): void {
    const track = musicFor(worldId);
    if (this.track === track && this.timer) return;
    this.stopMusic();
    if (!this.ctx) return;
    this.track = track;
    this.step = 0;
    this.nextStepTime = this.ctx.currentTime + 0.05;
    this.timer = setInterval(() => this.schedule(), SCHEDULE_INTERVAL_MS);
  }

  stopMusic(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.track = null;
  }

  /** Lowers the music (e.g. while paused) without stopping it. */
  setDucked(ducked: boolean): void {
    this.ducked = ducked;
    this.applyVolumes();
  }

  private schedule(): void {
    const ctx = this.ctx;
    const track = this.track;
    if (!ctx || !track || !this.music || ctx.state !== 'running') return;
    const stepSeconds = 60 / track.bpm / 2;
    while (this.nextStepTime < ctx.currentTime + LOOKAHEAD_S) {
      const i = this.step % track.melody.length;
      const note = track.melody[i];
      const bass = track.bass[i];
      if (note != null) this.tone(this.music, track.wave, midiToFrequency(note), midiToFrequency(note), this.nextStepTime, stepSeconds * 0.9, 0.08);
      if (bass != null) this.tone(this.music, 'triangle', midiToFrequency(bass), midiToFrequency(bass), this.nextStepTime, stepSeconds * 1.6, 0.12);
      this.nextStepTime += stepSeconds;
      this.step++;
    }
  }
}

/** Shared engine for the app (one AudioContext per page). */
export const audio = new AudioEngine();
