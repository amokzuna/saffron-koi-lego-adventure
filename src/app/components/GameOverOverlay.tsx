import type { GameOverInfo } from '../../game/bridge/GameBridge';
import { Overlay } from './Overlay';

interface Props {
  info: GameOverInfo;
  onContinue: () => void;
  onRestart: () => void;
  onExit: () => void;
}

export function GameOverOverlay({ info, onContinue, onRestart, onExit }: Props) {
  return (
    <Overlay title="Out of Hearts" testId="game-over">
      <p>
        You lost all your hearts. Continue {info.hasCheckpoint ? 'from your last checkpoint' : 'from the start of the level'} with full
        hearts — coins and bricks you already found are kept, and the timer keeps its time. A boss fight starts over. Or restart the level from scratch.
      </p>
      <div className="button-column">
        <button className="btn btn-primary" onClick={onContinue} autoFocus>
          {info.hasCheckpoint ? 'Continue from Checkpoint' : 'Continue from Start'}
        </button>
        <button className="btn" onClick={onRestart}>
          Restart Level
        </button>
        <button className="btn" onClick={onExit}>
          Level Map
        </button>
      </div>
    </Overlay>
  );
}
