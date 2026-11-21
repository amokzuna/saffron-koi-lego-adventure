import { CAMPAIGN_LEVEL_IDS, campaignNumber } from '../../data/campaign';
import { resolveLevel } from '../../data/levels';
import { useHero } from '../../features/character/HeroContext';
import { totalStars } from '../../features/progression/progress';
import { useProgress } from '../../features/progression/ProgressContext';
import type { Navigate } from '../App';
import { HeroPreview } from '../components/HeroPreview';
import { InstallButton } from '../components/InstallButton';
import { Logo } from '../components/Logo';

interface Props {
  onNavigate: Navigate;
  onPlay: (levelId: string) => void;
}

export function MainMenu({ onNavigate, onPlay }: Props) {
  const hero = useHero();
  const { progress, nextLevelId } = useProgress();
  const loading = hero.status === 'loading';
  const started = Object.keys(progress.levels).length > 0;
  const nextLevel = resolveLevel(nextLevelId);
  const stars = totalStars(progress, CAMPAIGN_LEVEL_IDS);

  return (
    <main className="screen screen-menu">
      <div className="panel menu-panel">
        <Logo />

        <div className="hero-card" aria-live="polite">
          {loading ? (
            <p role="status">Loading your hero…</p>
          ) : (
            <>
              <HeroPreview appearance={hero.appearance} scale={1.6} />
              <div className="hero-card-text">
                <span className="muted small">Playing as</span>
                <strong data-testid="hero-name">{hero.appearance.name}</strong>
                {hero.sessionOnly && <span className="muted small">Not saved on this device</span>}
                {started && (
                  <span className="muted small" data-testid="menu-stars">
                    ★ {stars} / {CAMPAIGN_LEVEL_IDS.length * 3} stars
                  </span>
                )}
              </div>
            </>
          )}
        </div>
        {hero.warning && (
          <div className="notice" role="alert">
            <p>{hero.warning}</p>
            <button className="btn btn-quiet" onClick={hero.dismissWarning}>
              OK
            </button>
          </div>
        )}

        <nav className="button-column" aria-label="Main menu">
          <button className="btn btn-primary btn-large btn-stacked" onClick={() => onPlay(nextLevelId)} disabled={loading} autoFocus>
            {started ? 'Continue' : 'Play'}
            <span className="btn-sub" data-testid="play-level">
              Level {campaignNumber(nextLevelId)}: {nextLevel.name}
            </span>
          </button>
          <button className="btn" onClick={() => onNavigate({ screen: 'map' })} disabled={loading}>
            Level Select
          </button>
          <button className="btn" onClick={() => onNavigate({ screen: 'heroSetup' })} disabled={loading}>
            Customize Hero
          </button>
          <button className="btn" onClick={() => onNavigate({ screen: 'settings' })}>
            Settings
          </button>
          <InstallButton />
          <button className="btn" onClick={() => onNavigate({ screen: 'howToPlay' })}>
            How to Play
          </button>
          <button className="btn" onClick={() => onNavigate({ screen: 'credits' })}>
            Credits
          </button>
        </nav>
        <p className="menu-note">20 levels across five worlds. Can you find every build brick?</p>
      </div>
    </main>
  );
}
