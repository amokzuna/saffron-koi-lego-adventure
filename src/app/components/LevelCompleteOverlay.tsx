import type { LevelResult } from '../../game/bridge/GameBridge';
import { formatTime } from '../format';
import { Overlay } from './Overlay';

export interface ProgressSummary {
  firstCompletion: boolean;
  newBestStars: boolean;
  newBestTime: boolean;
  saved: boolean;
  unlockedLevelName: string | null;
  worldCompleted: string | null;
}

interface Props {
  result: LevelResult;
  heroName: string;
  summary: ProgressSummary | null;
  nextLevel: { id: string; label: string } | null;
  /** True for the last campaign level: offers the ending instead of a next level. */
  isFinale: boolean;
  onViewEnding: () => void;
  onNext: (levelId: string) => void;
  onReplay: () => void;
  onExit: () => void;
}

export function LevelCompleteOverlay({ result, heroName, summary, nextLevel, isFinale, onViewEnding, onNext, onReplay, onExit }: Props) {
  const { rating } = result;
  const messages = [
    summary?.worldCompleted && `🏆 ${summary.worldCompleted} complete!`,
    summary?.unlockedLevelName && `🔓 Unlocked: ${summary.unlockedLevelName}`,
    summary?.newBestStars && '⭐ New best star rating!',
    summary?.newBestTime && '⏱ New best time!',
  ].filter(Boolean) as string[];

  return (
    <Overlay title="Level Complete!" testId="level-complete">
      <p className="muted result-level">
        Nice work, {heroName}! · {result.levelName}
      </p>
      <div className="stars" role="img" aria-label={`${rating.stars} of ${rating.criteria.length} stars`} data-testid="result-stars" data-stars={rating.stars}>
        {rating.criteria.map((c, i) => (
          <span key={c.id} className={`star ${i < rating.stars ? 'star-earned' : 'star-missed'}`} aria-hidden="true">
            ★
          </span>
        ))}
      </div>
      <ul className="criteria">
        {rating.criteria.map((c) => (
          <li key={c.id} className={c.met ? 'criterion-met' : 'criterion-missed'}>
            <span className="criterion-mark" aria-hidden="true">
              {c.met ? '✓' : '✗'}
            </span>
            {c.label}
            <span className="visually-hidden">{c.met ? ' — achieved' : ' — not achieved'}</span>
          </li>
        ))}
      </ul>
      <dl className="result-stats">
        <div>
          <dt>Time</dt>
          <dd>{formatTime(result.elapsedMs)}</dd>
        </div>
        <div>
          <dt>Coins</dt>
          <dd>
            {result.collected.coin} / {result.totals.coin}
          </dd>
        </div>
        <div>
          <dt>Bricks</dt>
          <dd>
            {result.collected.brick} / {result.totals.brick}
          </dd>
        </div>
        <div>
          <dt>Hearts lost</dt>
          <dd data-testid="result-hearts-lost">{result.heartsLost}</dd>
        </div>
      </dl>
      {messages.length > 0 && (
        <ul className="progress-messages" data-testid="progress-messages">
          {messages.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      )}
      {summary && !summary.saved && (
        <p className="error-text" role="alert">
          Progress couldn’t be saved on this device (storage may be off or full). It will be kept until you close the page.
        </p>
      )}
      <div className="button-column">
        {isFinale ? (
          <button className="btn btn-primary" onClick={onViewEnding} autoFocus>
            🏆 View Ending
          </button>
        ) : nextLevel ? (
          <button className="btn btn-primary btn-stacked" onClick={() => onNext(nextLevel.id)} autoFocus>
            Next Level
            <span className="btn-sub">{nextLevel.label}</span>
          </button>
        ) : null}
        <button className={`btn${nextLevel || isFinale ? '' : ' btn-primary'}`} onClick={onReplay} autoFocus={!nextLevel && !isFinale}>
          Play Again
        </button>
        <button className="btn" onClick={onExit}>
          Level Map
        </button>
      </div>
    </Overlay>
  );
}
