import { POWER_UPS } from '../../game/systems/powerUps';

interface Props {
  onBack: () => void;
}

export function HowToPlayScreen({ onBack }: Props) {
  return (
    <main className="screen">
      <div className="panel">
        <h1 className="panel-title">How to Play</h1>
        <p>Run, jump across gaps, collect coins and blue build bricks, and touch the flag to finish the level.</p>
        <table className="controls-table">
          <caption className="visually-hidden">Controls</caption>
          <thead>
            <tr>
              <th scope="col">Action</th>
              <th scope="col">Keyboard</th>
              <th scope="col">Touch</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Move</td>
              <td>
                <kbd>←</kbd> <kbd>→</kbd> or <kbd>A</kbd> <kbd>D</kbd>
              </td>
              <td>◀ ▶ buttons (bottom left)</td>
            </tr>
            <tr>
              <td>Jump</td>
              <td>
                <kbd>Space</kbd>, <kbd>↑</kbd> or <kbd>W</kbd>
              </td>
              <td>Jump button (bottom right)</td>
            </tr>
            <tr>
              <td>Pause</td>
              <td>
                <kbd>Esc</kbd> or <kbd>P</kbd>
              </td>
              <td>Pause button (top right)</td>
            </tr>
          </tbody>
        </table>
        <h2 className="section-title">Staying alive</h2>
        <ul className="rules-list">
          <li>You have 3 hearts. Spikes, enemies, and pits each cost one heart. After a hit you blink and are safe for a moment.</li>
          <li>Jump on an enemy from above to defeat it. Touching one from the side hurts. Spore Hoppers rest, then hop — move while they rest.</li>
          <li>Cracked wooden planks shake and fall shortly after you stand on them, then come back. Keep moving.</li>
          <li>Spiked balls move back and forth on fixed paths. Watch the rhythm, then pass.</li>
          <li>In dark places, follow the glowing mushrooms. Enemies and hazards always glow a little.</li>
          <li>Bosses show a warning (a red “!” or a target on the ground) before they attack, and have a moment when they can be stomped.</li>
          <li>Touch a checkpoint flag to raise it. Falling into a pit sends you back to the last raised flag.</li>
          <li>Out of hearts? Continue from your last checkpoint with full hearts, or restart the level.</li>
        </ul>
        <h2 className="section-title">Power-ups</h2>
        <ul className="rules-list">
          {Object.values(POWER_UPS).map((p) => (
            <li key={p.kind}>
              <strong>{p.label}:</strong> {p.description}
            </li>
          ))}
          <li>Collecting the same timed power-up again restarts its timer. Active power-ups and time left show at the top of the screen.</li>
        </ul>
        <h2 className="section-title">Stars</h2>
        <p className="muted">
          Earn up to 3 stars per level: one for reaching the goal, one for finding every blue build brick, and one for finishing within the
          par time. Hold jump longer to jump higher.
        </p>
        <div className="button-column">
          <button className="btn btn-primary" onClick={onBack} autoFocus>
            Back
          </button>
        </div>
      </div>
    </main>
  );
}
