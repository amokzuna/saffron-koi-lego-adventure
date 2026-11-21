import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { CAMPAIGN_LEVEL_IDS } from '../../data/campaign';
import type { LevelResult } from '../../game/bridge/GameBridge';
import { loadProgress, saveProgress } from '../../storage/progressStorage';
import { levelStatus, nextLevelToPlay, recordResult, type LevelStatus, type ProgressData, type RecordOutcome } from './progress';

interface ProgressContextValue {
  progress: ProgressData;
  statusOf: (levelId: string) => LevelStatus;
  nextLevelId: string;
  /** Records a campaign result. Returns null for non-campaign levels. */
  record: (result: LevelResult) => (RecordOutcome & { saved: boolean }) | null;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState(loadProgress);

  const record = useCallback(
    (result: LevelResult) => {
      if (!CAMPAIGN_LEVEL_IDS.includes(result.levelId)) return null;
      const outcome = recordResult(progress, result);
      let saved = true;
      try {
        saveProgress(outcome.progress);
      } catch {
        saved = false;
      }
      setProgress(outcome.progress);
      return { ...outcome, saved };
    },
    [progress],
  );

  const value = useMemo<ProgressContextValue>(
    () => ({
      progress,
      statusOf: (id) => levelStatus(progress, CAMPAIGN_LEVEL_IDS, id),
      nextLevelId: nextLevelToPlay(progress, CAMPAIGN_LEVEL_IDS),
      record,
    }),
    [progress, record],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used inside ProgressProvider');
  return ctx;
}
