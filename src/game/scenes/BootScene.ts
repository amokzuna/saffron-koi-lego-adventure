import Phaser from 'phaser';
import type { HeroAppearance } from '../../features/character/types';
import { generateHeroTextures, generateTextures } from '../systems/textures';
import { SceneKeys } from './sceneKeys';

/** Prepares shared assets (all generated at runtime, including the player's hero) and starts the level. */
export class BootScene extends Phaser.Scene {
  constructor(private readonly hero: HeroAppearance) {
    super(SceneKeys.Boot);
  }

  create(): void {
    generateTextures(this);
    generateHeroTextures(this, this.hero);
    this.scene.start(SceneKeys.Level);
  }
}
