import { useEffect, useState } from 'react';
import { installMode, type InstallMode } from './installMode';

/** Chrome's install prompt event (not yet in TypeScript's DOM types). */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

/** Registers the service worker (production builds only) and starts listening for install prompts. */
export function initPwa(): void {
  // The prompt event can fire before React renders, so capture it at startup.
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // we show our own Install button instead of the mini-infobar
    deferredPrompt = e as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    notify();
  });
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Offline support is an enhancement; the game works without it.
      });
    });
  }
}

/** True when running as an installed app (home-screen launch). */
export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function currentMode(): InstallMode {
  return installMode({
    standalone: isStandalone(),
    hasPrompt: deferredPrompt !== null,
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    maxTouchPoints: navigator.maxTouchPoints,
  });
}

export function useInstall(): { mode: InstallMode; install: () => Promise<void> } {
  const [mode, setMode] = useState(currentMode);
  useEffect(() => {
    const update = () => setMode(currentMode());
    listeners.add(update);
    update();
    return () => {
      listeners.delete(update);
    };
  }, []);

  const install = async () => {
    const prompt = deferredPrompt;
    if (!prompt) return;
    await prompt.prompt();
    await prompt.userChoice.catch(() => undefined);
    deferredPrompt = null; // a prompt can only be used once
    notify();
  };
  return { mode, install };
}

/**
 * On touch devices, entering a level goes full screen (browser tab on Android) and locks landscape where the
 * browser allows it. Installed apps are already full screen. iOS Safari supports neither; the rotate hint covers it.
 */
export async function enterGameDisplayMode(): Promise<void> {
  try {
    if (!isStandalone() && document.fullscreenEnabled && !document.fullscreenElement) {
      await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
    }
  } catch {
    // Not allowed (e.g. no user gesture); the game still works in the browser tab.
  }
  try {
    await (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }).lock?.('landscape');
  } catch {
    // Orientation lock is only allowed in full screen / installed apps on some browsers.
  }
}

export function leaveGameDisplayMode(): void {
  try {
    screen.orientation?.unlock?.();
  } catch {
    // Nothing to unlock.
  }
}
