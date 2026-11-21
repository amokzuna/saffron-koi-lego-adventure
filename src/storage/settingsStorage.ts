import { DEFAULT_SETTINGS, parseSettings, type Settings } from '../features/settings/settings';

const SETTINGS_KEY = 'lego-adventure:settings';

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? parseSettings(JSON.parse(raw)) : { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

/** Returns false if storage is unavailable (settings still apply for this session). */
export function saveSettings(settings: Settings): boolean {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}

/** Every localStorage key the game writes. */
export const ALL_STORAGE_KEYS = ['lego-adventure:settings', 'lego-adventure:progress', 'lego-adventure:hero'] as const;
