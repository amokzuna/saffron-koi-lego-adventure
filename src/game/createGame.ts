import Phaser from 'phaser';
import type { HeroAppearance } from '../features/character/types';
import { GAME_HEIGHT, GAME_WIDTH } from './config/constants';
import { MOVEMENT } from './config/movement';
import { BootScene } from './scenes/BootScene';
import { LevelScene, type LevelSceneServices } from './scenes/LevelScene';
import { REDUCED_MOTION_KEY } from './systems/fx';

export interface GameServices extends LevelSceneServices {
  hero: HeroAppearance;
  reducedMotion: boolean;
}

/** Creates the Phaser game inside `parent`. The caller owns the returned instance and must destroy it. */
export function createGame(parent: HTMLElement, services: GameServices): Phaser.Game {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#6cc0f0',
    banner: false,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: 'arcade',
      arcade: { gravity: { x: 0, y: MOVEMENT.gravity }, debug: false },
    },
    input: { activePointers: 4 },
    render: { antialias: true, roundPixels: true },
    scene: [new BootScene(services.hero), new LevelScene(services)],
  });
  game.registry.set(REDUCED_MOTION_KEY, services.reducedMotion);
  services.bridge.commands.on('setReducedMotion', (value) => game.registry.set(REDUCED_MOTION_KEY, value));
  return game;
}
