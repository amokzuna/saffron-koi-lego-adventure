import { useEffect, useState } from 'react';
import { audio } from '../features/audio/AudioEngine';
import { SettingsProvider } from '../features/settings/SettingsContext';
import { findLevel } from '../data/levels';
import { HeroProvider } from '../features/character/HeroContext';
import { ProgressProvider } from '../features/progression/ProgressContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CreditsScreen } from './screens/CreditsScreen';
import { GameScreen } from './screens/GameScreen';
import { HeroSetupScreen } from './screens/HeroSetupScreen';
import { HowToPlayScreen } from './screens/HowToPlayScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { MainMenu } from './screens/MainMenu';
import { EndingScreen } from './screens/EndingScreen';
import { WorldMapScreen } from './screens/WorldMapScreen';

export type Route =
  | { screen: 'menu' }
  | { screen: 'map' }
  | { screen: 'heroSetup' }
  | { screen: 'howToPlay' }
  | { screen: 'credits' }
  | { screen: 'ending' }
  | { screen: 'settings' }
  | { screen: 'game'; levelId: string; attempt: number };

export type Navigate = (route: Route) => void;

/**
 * Developer shortcut: `?level=<id>` opens any registered level directly (bypassing unlocks),
 * e.g. the systems sandbox used by the e2e tests.
 */
function initialRoute(): Route {
  const id = new URLSearchParams(window.location.search).get('level');
  const level = findLevel(id);
  return level ? { screen: 'game', levelId: level.id, attempt: 0 } : { screen: 'menu' };
}

export function App() {
  const [route, setRoute] = useState<Route>(initialRoute);
  const toMenu = () => setRoute({ screen: 'menu' });
  const toMap = () => setRoute({ screen: 'map' });
  const toEnding = () => setRoute({ screen: 'ending' });

  // Browsers only allow audio after a user gesture; unlock on the first one.
  useEffect(() => {
    const unlock = () => audio.unlock();
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);
  const play = (levelId: string) => setRoute((r) => ({ screen: 'game', levelId, attempt: r.screen === 'game' ? r.attempt + 1 : 0 }));

  return (
    <ErrorBoundary onReset={toMenu}>
      <SettingsProvider>
      <ProgressProvider>
        <HeroProvider>
          {route.screen === 'menu' && <MainMenu onNavigate={setRoute} onPlay={play} />}
          {route.screen === 'map' && <WorldMapScreen onPlay={play} onBack={toMenu} onViewEnding={toEnding} />}
          {route.screen === 'ending' && <EndingScreen onMap={toMap} onMenu={toMenu} />}
          {route.screen === 'heroSetup' && <HeroSetupScreen onDone={toMenu} />}
          {route.screen === 'howToPlay' && <HowToPlayScreen onBack={toMenu} />}
          {route.screen === 'credits' && <CreditsScreen onBack={toMenu} />}
          {route.screen === 'settings' && <SettingsScreen onBack={toMenu} />}
          {route.screen === 'game' && (
            // Keyed so "Next Level" mounts a fresh game instance.
            <GameScreen key={`${route.levelId}:${route.attempt}`} levelId={route.levelId} onExit={toMap} onPlayLevel={play} onViewEnding={toEnding} />
          )}
        </HeroProvider>
      </ProgressProvider>
      </SettingsProvider>
    </ErrorBoundary>
  );
}
