/**
 * How (or whether) to offer installing the game to the home screen.
 * - 'installed': already running as an installed app; offer nothing.
 * - 'prompt': the browser fired `beforeinstallprompt` (Chrome/Edge/Android); show an Install button.
 * - 'ios': iPhone/iPad (no install API); show "Add to Home Screen" instructions.
 * - 'unavailable': nothing useful to offer (e.g. desktop Safari/Firefox).
 */
export type InstallMode = 'installed' | 'prompt' | 'ios' | 'unavailable';

export interface InstallEnvironment {
  standalone: boolean;
  hasPrompt: boolean;
  userAgent: string;
  platform: string;
  maxTouchPoints: number;
}

export function isIos(env: Pick<InstallEnvironment, 'userAgent' | 'platform' | 'maxTouchPoints'>): boolean {
  // iPadOS 13+ reports itself as a Mac, but has touch.
  return /iPhone|iPad|iPod/.test(env.userAgent) || (env.platform === 'MacIntel' && env.maxTouchPoints > 1);
}

export function installMode(env: InstallEnvironment): InstallMode {
  if (env.standalone) return 'installed';
  if (env.hasPrompt) return 'prompt';
  if (isIos(env)) return 'ios';
  return 'unavailable';
}
