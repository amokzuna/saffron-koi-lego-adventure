import { CAMPAIGN_LEVEL_IDS, CAMPAIGN_LEVELS } from '../../data/campaign';
import { useHero } from '../../features/character/HeroContext';
import { totalStars } from '../../features/progression/progress';
import { useProgress } from '../../features/progression/ProgressContext';
import { formatTime } from '../format';
import { HeroPreview } from '../components/HeroPreview';

interface Props {
  onMap: () => void;
  onMenu: () => void;
}

/** Campaign completion: celebrates the player's hero and summarises their best results. */
export function EndingScreen({ onMap, onMenu }: Props) {
  const { appearance } = useHero();
  const { progress } = useProgress();
  const records = CAMPAIGN_LEVEL_IDS.map((id) => progress.levels[id]);
  const completed = records.filter(Boolean).length;
  const bricks = records.reduce((sum, r) => sum + (r?.bestBricks ?? 0), 0);
  const totalBricks = CAMPAIGN_LEVELS.reduce((sum, l) => sum + l.collectibles.filter((c) => c.kind === 'brick').length, 0);
  const totalTime = records.reduce((sum, r) => sum + (r?.bestTimeMs ?? 0), 0);

  return (
    <main className="screen screen-scroll">
      <div className="panel ending-panel" data-testid="ending">
        <h1 className="panel-title">The Brick Kingdom is safe!</h1>
        <div className="ending-hero">
          <HeroPreview appearance={appearance} scale={4} pose="jump" />
        </div>
        <p className="ending-text">
          {appearance.name} crossed the Green Grassland, the Mushroom Forest, the Desert Kingdom, and the Frozen Kingdom, and defeated the
          Final Guardian in the Lava Volcano. Thanks for playing!
        </p>
        <dl className="result-stats">
          <div>
            <dt>Levels</dt>
            <dd>
              {completed} / {CAMPAIGN_LEVEL_IDS.length}
            </dd>
          </div>
          <div>
            <dt>Stars</dt>
            <dd>
              {totalStars(progress, CAMPAIGN_LEVEL_IDS)} / {CAMPAIGN_LEVEL_IDS.length * 3}
            </dd>
          </div>
          <div>
            <dt>Build bricks</dt>
            <dd>
              {bricks} / {totalBricks}
            </dd>
          </div>
          <div>
            <dt>Best times total</dt>
            <dd>{formatTime(totalTime)}</dd>
          </div>
        </dl>
        <section className="ending-credits" aria-label="Credits">
          <h2 className="section-title">Credits</h2>
          <ul className="credits-list">
            <li>Game design &amp; code: the LEGO Adventure team</li>
            <li>Art, music, and sound: original, generated in code</li>
            <li>Built with Phaser 3, React, TypeScript, and Vite</li>
          </ul>
          <p className="muted small">This project is not affiliated with or endorsed by the LEGO Group.</p>
        </section>
        <div className="button-column">
          <button className="btn btn-primary" onClick={onMap} autoFocus>
            Level Map
          </button>
          <button className="btn" onClick={onMenu}>
            Main Menu
          </button>
        </div>
      </div>
    </main>
  );
}
