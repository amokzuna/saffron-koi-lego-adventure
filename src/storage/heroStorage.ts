import { decodeStoredImage } from '../features/character/decodeImage';
import { parseHeroProfile } from '../features/character/heroProfile';
import { DEFAULT_PROFILE, type HeroProfile, type PortraitSource } from '../features/character/types';
import { deleteImage, getImage, putImage } from './imageStore';

/**
 * Hero persistence: metadata in localStorage (versioned, validated on load) and the cropped
 * portrait as a PNG blob in IndexedDB. The original upload is never stored.
 */
const PROFILE_KEY = 'lego-adventure:hero';
const PORTRAIT_KEY = 'hero-portrait';

export interface LoadedHero {
  profile: HeroProfile;
  portrait: PortraitSource | null;
  /** User-facing notice when saved data could not be fully restored. */
  warning: string | null;
}

export type PortraitChange = { kind: 'keep' } | { kind: 'set'; blob: Blob } | { kind: 'remove' };

function readProfile(): HeroProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? parseHeroProfile(JSON.parse(raw)) : { ...DEFAULT_PROFILE };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

export async function loadHero(): Promise<LoadedHero> {
  const profile = readProfile();
  if (!profile.hasPortrait) return { profile, portrait: null, warning: null };
  try {
    const blob = await getImage(PORTRAIT_KEY);
    if (!blob) throw new Error('missing portrait');
    return { profile, portrait: await decodeStoredImage(blob), warning: null };
  } catch {
    return {
      profile: { ...profile, hasPortrait: false },
      portrait: null,
      warning: 'Your saved hero photo couldn’t be loaded on this device, so the default face is being used.',
    };
  }
}

/** Persists the hero. Throws if storage is unavailable or full; callers show the error. */
export async function saveHero(profile: HeroProfile, change: PortraitChange): Promise<void> {
  if (change.kind === 'set') await putImage(PORTRAIT_KEY, change.blob);
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  if (change.kind === 'remove') {
    // Profile already says "no portrait", so a failed delete leaves only an unused blob.
    await deleteImage(PORTRAIT_KEY).catch(() => undefined);
  }
}

export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not encode image'))), 'image/png'),
  );
}
