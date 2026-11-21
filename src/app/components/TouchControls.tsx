import { useState, type PointerEvent } from 'react';
import type { ControlState, VirtualControls } from '../../game/input/InputState';

interface ButtonProps {
  control: keyof ControlState;
  label: string;
  symbol: string;
  controls: VirtualControls;
  className: string;
}

function TouchButton({ control, label, symbol, controls, className }: ButtonProps) {
  const [active, setActive] = useState(false);

  const press = (e: PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    try {
      // Keep receiving this finger's events even if it slides off the button.
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Capture can fail for synthetic or already-released pointers; the button still works without it.
    }
    controls.set(control, true);
    setActive(true);
  };
  const release = () => {
    controls.set(control, false);
    setActive(false);
  };

  return (
    <button
      type="button"
      className={`touch-btn ${className}${active ? ' is-active' : ''}`}
      aria-label={label}
      tabIndex={-1}
      onPointerDown={press}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      onContextMenu={(e) => e.preventDefault()}
    >
      <span aria-hidden="true">{symbol}</span>
    </button>
  );
}

interface Props {
  controls: VirtualControls;
}

/** On-screen controls for touch devices. Writes directly into the shared VirtualControls state. */
export function TouchControls({ controls }: Props) {
  return (
    <div className="touch-controls" data-testid="touch-controls">
      <div className="touch-cluster">
        <TouchButton control="left" label="Move left" symbol="◀" controls={controls} className="touch-left" />
        <TouchButton control="right" label="Move right" symbol="▶" controls={controls} className="touch-right" />
      </div>
      <div className="touch-cluster">
        <TouchButton control="jump" label="Jump" symbol="⤒" controls={controls} className="touch-jump" />
      </div>
    </div>
  );
}
