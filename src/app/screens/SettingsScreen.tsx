import { useState } from 'react';
import { clearAllSavedData } from '../../storage/clearAll';
import { SettingsPanel } from '../components/SettingsPanel';

interface Props {
  onBack: () => void;
}

export function SettingsScreen({ onBack }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const deleteEverything = async () => {
    setBusy(true);
    await clearAllSavedData();
    // Reload so every part of the app starts from a clean state.
    window.location.reload();
  };

  return (
    <main className="screen screen-scroll">
      <div className="panel settings-screen">
        <h1 className="panel-title">Settings</h1>
        <SettingsPanel />

        <section className="field" aria-labelledby="data-heading">
          <h2 id="data-heading" className="section-title">
            Saved data
          </h2>
          <p className="muted small">
            Progress, your hero (including the photo), and settings are stored only in this browser. Nothing is sent to a server.
          </p>
          {confirming ? (
            <div className="error-box" role="alert">
              <p>Delete all progress, your hero and photo, and settings? This cannot be undone. The page will reload.</p>
              <div className="button-row">
                <button className="btn btn-danger" onClick={deleteEverything} disabled={busy}>
                  Yes, delete everything
                </button>
                <button className="btn" onClick={() => setConfirming(false)} disabled={busy} autoFocus>
                  Keep my data
                </button>
              </div>
            </div>
          ) : (
            <button className="btn btn-quiet" onClick={() => setConfirming(true)}>
              Delete all saved data…
            </button>
          )}
        </section>

        <div className="button-column">
          <button className="btn btn-primary" onClick={onBack} autoFocus>
            Back
          </button>
        </div>
      </div>
    </main>
  );
}
