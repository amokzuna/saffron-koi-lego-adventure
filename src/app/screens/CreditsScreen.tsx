interface Props {
  onBack: () => void;
}

export function CreditsScreen({ onBack }: Props) {
  return (
    <main className="screen">
      <div className="panel">
        <h1 className="panel-title">Credits</h1>
        <p>An original brick-inspired platform adventure.</p>
        <ul className="credits-list">
          <li>Game design &amp; code: the LEGO Adventure team</li>
          <li>Art, music, and sound effects: original, generated in code (no external assets)</li>
          <li>Built with Phaser 3, React, TypeScript, and Vite</li>
        </ul>
        <p className="muted">This project is not affiliated with or endorsed by the LEGO Group.</p>
        <div className="button-column">
          <button className="btn btn-primary" onClick={onBack} autoFocus>
            Back
          </button>
        </div>
      </div>
    </main>
  );
}
