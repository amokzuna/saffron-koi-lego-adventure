import type { HudState } from '../../game/bridge/GameBridge';
import { formatTime } from '../format';
import { BossBar } from './BossBar';
import { Hearts } from './Hearts';

interface Props {
  hud: HudState;
  onPause: () => void;
  pauseDisabled: boolean;
}

export function Hud({ hud, onPause, pauseDisabled }: Props) {
  return (
    <div className="hud">
      <div className="hud-rows">
        <div className="hud-group">
          <Hearts current={hud.hearts} max={hud.maxHearts} />
          <span className="hud-chip" data-testid="hud-coins" aria-label={`Coins ${hud.collected.coin} of ${hud.totals.coin}`}>
            <span className="icon-coin" aria-hidden="true" />
            {hud.collected.coin}/{hud.totals.coin}
          </span>
          <span className="hud-chip" data-testid="hud-bricks" aria-label={`Bricks ${hud.collected.brick} of ${hud.totals.brick}`}>
            <span className="icon-brick" aria-hidden="true" />
            {hud.collected.brick}/{hud.totals.brick}
          </span>
          <span className="hud-chip hud-time" data-testid="hud-time" aria-label="Time">
            ⏱ {formatTime(hud.elapsedMs)}
          </span>
          <span className="hud-chip hud-level">{hud.levelName}</span>
        </div>
        {hud.powerUps.length > 0 && (
          <ul className="hud-group hud-powerups" aria-label="Active power-ups" data-testid="hud-powerups">
            {hud.powerUps.map((p) => (
              <li key={p.kind} className={`hud-chip powerup-chip powerup-${p.kind}`}>
                {p.label} {Math.ceil(p.remainingMs / 1000)}s
                <span className="powerup-bar" aria-hidden="true">
                  <span style={{ width: `${(p.remainingMs / p.durationMs) * 100}%` }} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {hud.boss && <BossBar boss={hud.boss} />}
      <button className="hud-pause" onClick={onPause} disabled={pauseDisabled} aria-label="Pause game" data-testid="pause-button">
        <span aria-hidden="true">❚❚</span>
      </button>
    </div>
  );
}
