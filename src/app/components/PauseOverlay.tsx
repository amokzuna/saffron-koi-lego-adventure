import { useState } from 'react';
import { Overlay } from './Overlay';
import { SettingsPanel } from './SettingsPanel';

interface Props {
  onResume: () => void;
  onRestart: () => void;
  onExit: () => void;
}

export function PauseOverlay({ onResume, onRestart, onExit }: Props) {
  const [confirmingExit, setConfirmingExit] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  if (showSettings) {
    return (
      <Overlay title="Settings" testId="pause-settings">
        <SettingsPanel />
        <div className="button-column">
          <button className="btn btn-primary" onClick={() => setShowSettings(false)} autoFocus>
            Back
          </button>
        </div>
      </Overlay>
    );
  }

  if (confirmingExit) {
    return (
      <Overlay title="Leave level?" testId="confirm-exit">
        <p>Your progress in this level (coins, bricks, and time) will be lost.</p>
        <div className="button-column">
          <button className="btn btn-primary" onClick={() => setConfirmingExit(false)} autoFocus>
            Keep Playing
          </button>
          <button className="btn btn-danger" onClick={onExit}>
            Leave to Level Map
          </button>
        </div>
      </Overlay>
    );
  }

  return (
    <Overlay title="Paused" testId="pause-menu">
      <div className="button-column">
        <button className="btn btn-primary" onClick={onResume} autoFocus>
          Resume
        </button>
        <button className="btn" onClick={onRestart}>
          Restart Level
        </button>
        <button className="btn" onClick={() => setShowSettings(true)}>
          Settings
        </button>
        <button className="btn" onClick={() => setConfirmingExit(true)}>
          Level Map
        </button>
      </div>
      <p className="muted small">Press Esc to resume.</p>
    </Overlay>
  );
}
