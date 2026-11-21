import { Overlay } from './Overlay';

interface Props {
  onDismiss: () => void;
}

export function RotateHint({ onDismiss }: Props) {
  return (
    <Overlay title="Rotate your device" testId="rotate-hint">
      <div className="rotate-icon" aria-hidden="true">
        📱↻
      </div>
      <p>This game plays best in landscape. Turn your phone sideways to continue.</p>
      <div className="button-column">
        <button className="btn" onClick={onDismiss}>
          Play in Portrait Anyway
        </button>
      </div>
    </Overlay>
  );
}
