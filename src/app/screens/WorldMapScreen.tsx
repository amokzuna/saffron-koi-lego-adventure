import { CAMPAIGN_LEVEL_IDS, WORLDS, campaignNumber } from '../../data/campaign';
import { useHero } from '../../features/character/HeroContext';
import { useProgress } from '../../features/progression/ProgressContext';
import { formatTime } from '../format';

interface Props {
  onPlay: (levelId: string) => void;
  onBack: () => void;
  onViewEnding: () => void;
}

function Stars({ count }: { count: number }) {
  return (
    <span className="tile-stars" aria-label={`${count} of 3 stars`}>
      {[0, 1, 2].map((i) => (
        <span key={i} className={i < count ? 'star-earned' : 'star-missed'} aria-hidden="true">
          ★
        </span>
      ))}
    </span>
  );
}

export function WorldMapScreen({ onPlay, onBack, onViewEnding }: Props) {
  const { progress, statusOf, nextLevelId } = useProgress();
  const hero = useHero();

  return (
    <main className="screen screen-scroll">
      <div className="panel map-panel">
        <div className="map-header">
          <button className="btn" onClick={onBack} autoFocus>
            ← Menu
          </button>
          <h1 className="panel-title">Level Select</h1>
          <span aria-hidden="true" className="map-header-spacer" />
        </div>

        {WORLDS.map((world) => (
          <section key={world.id} className="world" style={{ ['--world-accent' as string]: world.accent }} aria-labelledby={`world-${world.id}`}>
            <h2 id={`world-${world.id}`} className="world-title">
              <span className="world-badge">World {world.id}</span> {world.name}
            </h2>

            {world.levels.length === 0 ? (
              <p className="world-coming-soon" data-testid={`world-${world.id}-coming-soon`}>
                🔒 Coming in a future update · {world.plannedLevels} levels planned
              </p>
            ) : (
              <ol className="level-grid">
                {world.levels.map((level) => {
                  const status = statusOf(level.id);
                  const record = progress.levels[level.id];
                  const number = campaignNumber(level.id);
                  const isNext = level.id === nextLevelId && status === 'available';
                  const locked = status === 'locked';
                  const description = locked
                    ? `locked — complete level ${(number ?? 1) - 1} to unlock`
                    : status === 'completed'
                      ? `completed, ${record?.bestStars ?? 0} of 3 stars`
                      : 'not completed yet';
                  return (
                    <li key={level.id}>
                      <button
                        className={`level-tile level-${status}${isNext ? ' level-next' : ''}`}
                        disabled={locked}
                        onClick={() => onPlay(level.id)}
                        aria-label={`Level ${number}: ${level.name}, ${description}${level.boss ? ', boss level' : ''}`}
                        data-testid={`level-tile-${level.id}`}
                        data-status={status}
                      >
                        <span className="level-number">{locked ? '🔒' : number}</span>
                        <span className="level-name">{level.name}</span>
                        {level.boss && <span className="level-tag">Boss</span>}
                        {status === 'completed' && record ? (
                          <>
                            <Stars count={record.bestStars} />
                            <span className="level-best">Best {formatTime(record.bestTimeMs)}</span>
                          </>
                        ) : isNext ? (
                          <span className="level-tag level-tag-next">Next</span>
                        ) : locked ? (
                          <span className="level-best">Locked</span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        ))}
        {statusOf(CAMPAIGN_LEVEL_IDS.at(-1)!) === 'completed' && (
          <div className="button-column">
            <button className="btn btn-primary" onClick={onViewEnding}>
              🏆 View Ending
            </button>
          </div>
        )}
        <p className="muted small">Playing as {hero.appearance.name}. Completing a level unlocks the next one; completed levels can be replayed any time.</p>
      </div>
    </main>
  );
}
