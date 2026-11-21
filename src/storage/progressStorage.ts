import { emptyProgress, parseProgress, type ProgressData } from '../features/progression/progress';

const PROGRESS_KEY = 'lego-adventure:progress';

export function loadProgress(): ProgressData {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? parseProgress(JSON.parse(raw)) : emptyProgress();
  } catch {
    return emptyProgress();
  }
}

/** Throws if storage is unavailable or full; callers show a notice. */
export function saveProgress(progress: ProgressData): void {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}
