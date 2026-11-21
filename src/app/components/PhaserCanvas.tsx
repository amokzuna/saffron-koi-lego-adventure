import { useEffect, useRef } from 'react';
import { GameBridge } from '../../game/bridge/GameBridge';
import { createGame } from '../../game/createGame';
import type { HeroAppearance } from '../../features/character/types';
import type { VirtualControls } from '../../game/input/InputState';
import type { LevelDefinition } from '../../game/levels/types';

interface Props {
  level: LevelDefinition;
  controls: VirtualControls;
  hero: HeroAppearance;
  /** Initial reduced-motion flag; later changes are sent through the bridge by the parent. */
  reducedMotion: boolean;
  /** Called with a fresh bridge each time a game instance is created, so the parent can subscribe. */
  onBridge: (bridge: GameBridge) => () => void;
}

/** Owns the Phaser.Game lifecycle. The game is created on mount and destroyed on unmount. */
export function PhaserCanvas({ level, controls, hero, reducedMotion, onBridge }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onBridgeRef = useRef(onBridge);
  onBridgeRef.current = onBridge;
  const reducedMotionRef = useRef(reducedMotion);
  reducedMotionRef.current = reducedMotion;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const bridge = new GameBridge();
    const unsubscribe = onBridgeRef.current(bridge);
    const game = createGame(container, { bridge, controls, level, hero, reducedMotion: reducedMotionRef.current });
    return () => {
      unsubscribe();
      bridge.dispose();
      game.destroy(true);
    };
  }, [level, controls, hero]);

  return <div ref={containerRef} className="game-canvas" data-testid="game-canvas" />;
}
