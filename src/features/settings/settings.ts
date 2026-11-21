/** Player settings, persisted in localStorage (versioned and validated like other saves). */
export type ReducedMotionSetting = 'system' | 'on' | 'off';
export type TouchControlsSetting = 'auto' | 'always' | 'never';

export interface Settings {
  version: 1;
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  muted: boolean;
  reducedMotion: ReducedMotionSetting;
  touchControls: TouchControlsSetting;
}

export const DEFAULT_SETTINGS: Settings = {
  version: 1,
  masterVolume: 0.8,
  musicVolume: 0.5,
  sfxVolume: 0.8,
  muted: false,
  reducedMotion: 'system',
  touchControls: 'auto',
};

const volume = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : fallback);
const oneOf = <T extends string>(v: unknown, options: readonly T[], fallback: T): T => (options.includes(v as T) ? (v as T) : fallback);

export function parseSettings(raw: unknown): Settings {
  if (typeof raw !== 'object' || raw === null) return { ...DEFAULT_SETTINGS };
  const d = raw as Record<string, unknown>;
  if (d.version !== 1) return { ...DEFAULT_SETTINGS };
  return {
    version: 1,
    masterVolume: volume(d.masterVolume, DEFAULT_SETTINGS.masterVolume),
    musicVolume: volume(d.musicVolume, DEFAULT_SETTINGS.musicVolume),
    sfxVolume: volume(d.sfxVolume, DEFAULT_SETTINGS.sfxVolume),
    muted: d.muted === true,
    reducedMotion: oneOf(d.reducedMotion, ['system', 'on', 'off'] as const, DEFAULT_SETTINGS.reducedMotion),
    touchControls: oneOf(d.touchControls, ['auto', 'always', 'never'] as const, DEFAULT_SETTINGS.touchControls),
  };
}

/** Resolves the reduced-motion setting against the OS preference. */
export function prefersReducedMotion(setting: ReducedMotionSetting, systemPrefers: boolean): boolean {
  return setting === 'on' || (setting === 'system' && systemPrefers);
}

export function showTouchControls(setting: TouchControlsSetting, touchDevice: boolean): boolean {
  return setting === 'always' || (setting === 'auto' && touchDevice);
}
