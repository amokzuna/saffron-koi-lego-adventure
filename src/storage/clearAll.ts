import { deleteImage } from './imageStore';
import { ALL_STORAGE_KEYS } from './settingsStorage';

/** Deletes all locally saved game data: progress, hero (including the photo), and settings. */
export async function clearAllSavedData(): Promise<void> {
  for (const key of ALL_STORAGE_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch {
      // Storage unavailable: nothing was saved there.
    }
  }
  await deleteImage('hero-portrait').catch(() => undefined);
}
