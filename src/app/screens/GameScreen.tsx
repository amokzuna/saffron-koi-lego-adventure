import { useCallback, useEffect, useRef, useState } from 'react';
import { CAMPAIGN_LEVEL_IDS, WORLDS, campaignNumber, nextCampaignLevelId } from '../../data/campaign';
import { resolveLevel } from '../../data/levels';
import { audio } from '../../features/audio/AudioEngine';
import { useHero } from '../../features/character/HeroContext';
import { useSettings } from '../../features/settings/SettingsContext';
import { showTouchControls } from '../../features/settings/settings';
import { enterGameDisplayMode, leaveGameDisplayMode } from '../../pwa/pwa';
import { useProgress } from '../../features/progression/ProgressContext';
import type { GameBridge, GameOverInfo, HudState, LevelResult } from '../../game/bridge/GameBridge';
import { VirtualControls } from '../../game/input/InputState';
import { GameOverOverlay } from '../components/GameOverOverlay';
import { Hud } from '../components/Hud';
import { LevelCompleteOverlay, type ProgressSummary } from '../components/LevelCompleteOverlay';
import { PauseOverlay } from '../components/PauseOverlay';
import { PhaserCanvas } from '../components/PhaserCanvas';
import { RotateHint } from '../components/RotateHint';
import { TouchControls } from '../components/TouchControls';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useTouchDevice } from '../hooks/useTouchDevice';

type Status = 'loading' | 'playing' | 'paused' | 'complete' | 'gameOver';

interface Props {
  levelId: string;
  onExit: () => void;
  onPlayLevel: (levelId: string) => void;
  onViewEnding: () => void;
}

export function GameScreen({ levelId, onExit, onPlayLevel, onViewEnding }: Props) {
  const [level] = useState(() => resolveLevel(levelId));
  const progress = useProgress();
  const recordRef = useRef(progress.record);
  recordRef.current = progress.record;
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  // Snapshot the hero at mount so later context updates never recreate the running game.
  const { appearance } = useHero();
  const [hero] = useState(appearance);
  const [controls] = useState(() => new VirtualControls());
  const bridgeRef = useRef<GameBridge | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [hud, setHud] = useState<HudState | null>(null);
  const [result, setResult] = useState<LevelResult | null>(null);
  const [gameOver, setGameOver] = useState<GameOverInfo | null>(null);
  const [portraitDismissed, setPortraitDismissed] = useState(false);

  const { settings, reducedMotion } = useSettings();
  const isTouchDevice = useTouchDevice();
  const isTouch = showTouchControls(settings.touchControls, isTouchDevice);
  const isPortrait = useMediaQuery('(orientation: portrait)');
  const showRotateHint = isTouchDevice && isPortrait && !portraitDismissed && (status === 'loading' || status === 'playing' || status === 'paused');

  const statusRef = useRef(status);
  statusRef.current = status;

  const handleBridge = useCallback((bridge: GameBridge) => {
    bridgeRef.current = bridge;
    const offs = [
      bridge.events.on('ready', () => {
        setResult(null);
        setGameOver(null);
        setStatus('playing');
      }),
      bridge.events.on('gameOver', (info) => {
        setGameOver(info);
        setStatus('gameOver');
      }),
      bridge.events.on('hud', setHud),
      bridge.events.on('sound', (id) => audio.play(id)),
      bridge.events.on('levelComplete', (r) => {
        const outcome = recordRef.current(r);
        if (outcome) {
          const nextId = nextCampaignLevelId(r.levelId);
          const world = WORLDS.find((w) => w.levels.some((l) => l.id === r.levelId));
          const lastInWorld = world?.levels.at(-1)?.id === r.levelId;
          setSummary({
            firstCompletion: outcome.firstCompletion,
            newBestStars: outcome.newBestStars,
            newBestTime: outcome.newBestTime,
            saved: outcome.saved,
            unlockedLevelName: outcome.firstCompletion && nextId ? resolveLevel(nextId).name : null,
            worldCompleted: outcome.firstCompletion && lastInWorld && world ? `World ${world.id}: ${world.name}` : null,
          });
        }
        setResult(r);
        setStatus('complete');
      }),
    ];
    return () => {
      offs.forEach((off) => off());
      if (bridgeRef.current === bridge) bridgeRef.current = null;
    };
  }, []);

  const pause = useCallback(() => {
    if (statusRef.current !== 'playing') return;
    bridgeRef.current?.commands.emit('pause', undefined);
    setStatus('paused');
  }, []);

  const resume = useCallback(() => {
    if (statusRef.current !== 'paused') return;
    bridgeRef.current?.commands.emit('resume', undefined);
    setStatus('playing');
  }, []);

  const restart = useCallback(() => {
    setStatus('loading');
    setResult(null);
    setSummary(null);
    setGameOver(null);
    bridgeRef.current?.commands.emit('restart', undefined);
  }, []);

  const continueFromCheckpoint = useCallback(() => {
    bridgeRef.current?.commands.emit('continueFromCheckpoint', undefined);
  }, []);

  // Music: the world's loop while playing, lowered while paused or out of hearts, stopped on completion.
  useEffect(() => {
    if (status === 'playing') {
      audio.startMusic(level.worldId);
      audio.setDucked(false);
    } else if (status === 'paused' || status === 'gameOver') {
      audio.setDucked(true);
    } else if (status === 'complete') {
      audio.stopMusic();
    }
  }, [status, level.worldId]);
  useEffect(() => () => audio.stopMusic(), []);

  // Touch devices: full screen and landscape while playing, where the browser allows it.
  useEffect(() => {
    if (!isTouchDevice) return;
    void enterGameDisplayMode();
    return () => leaveGameDisplayMode();
  }, [isTouchDevice]);

  // Live reduced-motion changes (e.g. from the pause menu settings).
  useEffect(() => {
    bridgeRef.current?.commands.emit('setReducedMotion', reducedMotion);
  }, [reducedMotion]);

  // Keyboard pause toggle (Escape / P).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || (e.key !== 'Escape' && e.key.toLowerCase() !== 'p')) return;
      if (statusRef.current === 'playing') pause();
      else if (statusRef.current === 'paused' && e.key === 'Escape') resume();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pause, resume]);

  // Pause automatically when the tab is hidden or the window loses focus.
  useEffect(() => {
    const onHidden = () => {
      if (document.visibilityState === 'hidden') pause();
    };
    document.addEventListener('visibilitychange', onHidden);
    window.addEventListener('blur', pause);
    return () => {
      document.removeEventListener('visibilitychange', onHidden);
      window.removeEventListener('blur', pause);
    };
  }, [pause]);

  // Pause while the rotate hint covers the game (including when the level finishes loading behind it).
  useEffect(() => {
    if (showRotateHint && status === 'playing') pause();
  }, [showRotateHint, status, pause]);

  const nextId = nextCampaignLevelId(level.id);
  const nextLevel = nextId && progress.statusOf(nextId) !== 'locked' ? { id: nextId, label: `Level ${campaignNumber(nextId)}: ${resolveLevel(nextId).name}` } : null;

  return (
    <main className="game-screen" aria-label="Game">
      <PhaserCanvas level={level} controls={controls} hero={hero} reducedMotion={reducedMotion} onBridge={handleBridge} />

      {hud && <Hud hud={hud} onPause={pause} pauseDisabled={status !== 'playing'} />}
      {isTouch && status === 'playing' && !showRotateHint && <TouchControls controls={controls} />}

      {status === 'loading' && (
        <div className="loading" role="status">
          Loading level…
        </div>
      )}

      {status === 'paused' && !showRotateHint && <PauseOverlay onResume={resume} onRestart={restart} onExit={onExit} />}
      {status === 'complete' && result && (
        <LevelCompleteOverlay
          result={result}
          heroName={hero.name}
          summary={summary}
          nextLevel={nextLevel}
          isFinale={level.id === CAMPAIGN_LEVEL_IDS.at(-1)}
          onViewEnding={onViewEnding}
          onNext={onPlayLevel}
          onReplay={restart}
          onExit={onExit}
        />
      )}
      {status === 'gameOver' && gameOver && (
        <GameOverOverlay info={gameOver} onContinue={continueFromCheckpoint} onRestart={restart} onExit={onExit} />
      )}
      {showRotateHint && <RotateHint onDismiss={() => setPortraitDismissed(true)} />}
    </main>
  );
}
