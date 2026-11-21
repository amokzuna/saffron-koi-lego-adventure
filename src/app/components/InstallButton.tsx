import { useState } from 'react';
import { useInstall } from '../../pwa/pwa';

/** Offers installing the game to the home screen, only where it is actually possible. */
export function InstallButton() {
  const { mode, install } = useInstall();
  const [showIosHelp, setShowIosHelp] = useState(false);

  if (mode === 'installed' || mode === 'unavailable') return null;

  return (
    <>
      <button className="btn btn-install" onClick={() => (mode === 'prompt' ? void install() : setShowIosHelp(true))} data-testid="install-button">
        📲 {mode === 'prompt' ? 'Install App' : 'Add to Home Screen'}
        <span className="btn-sub">Play full screen, even offline</span>
      </button>
      {showIosHelp && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="ios-install-title" data-testid="ios-install-help">
          <div className="panel">
            <h2 id="ios-install-title" className="panel-title">
              Add to Home Screen
            </h2>
            <ol className="install-steps">
              <li>
                Tap the <strong>Share</strong> button <span aria-hidden="true">(□↑)</span> in the browser toolbar.
              </li>
              <li>
                Scroll down and choose <strong>Add to Home Screen</strong>.
              </li>
              <li>
                Tap <strong>Add</strong>, then open the game from its new icon to play full screen.
              </li>
            </ol>
            <div className="button-column">
              <button className="btn btn-primary" onClick={() => setShowIosHelp(false)} autoFocus>
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
