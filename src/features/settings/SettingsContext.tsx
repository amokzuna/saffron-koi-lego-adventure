import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useMediaQuery } from '../../app/hooks/useMediaQuery';
import { loadSettings, saveSettings } from '../../storage/settingsStorage';
import { audio } from '../audio/AudioEngine';
import { prefersReducedMotion, type Settings } from './settings';

interface SettingsContextValue {
  settings: Settings;
  update: (patch: Partial<Omit<Settings, 'version'>>) => void;
  /** Effective reduced-motion flag (setting combined with the OS preference). */
  reducedMotion: boolean;
  saved: boolean;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState(loadSettings);
  const [saved, setSaved] = useState(true);
  const systemReduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const reducedMotion = prefersReducedMotion(settings.reducedMotion, systemReduced);

  useEffect(() => {
    audio.setVolumes(settings);
  }, [settings]);

  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reducedMotion);
  }, [reducedMotion]);

  const update = useCallback((patch: Partial<Omit<Settings, 'version'>>) => {
    setSettings((current) => {
      const next = { ...current, ...patch };
      setSaved(saveSettings(next));
      return next;
    });
  }, []);

  const value = useMemo(() => ({ settings, update, reducedMotion, saved }), [settings, update, reducedMotion, saved]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
}
