import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/constants';
import { TextureKeys } from '../config/textureKeys';
import type { DarknessSettings } from '../levels/types';
import { LIGHT_LARGE_RADIUS } from './textures';

export interface LightSource {
  x: number;
  y: number;
  radius: number;
}

/** The overlay is drawn at 1/DARKNESS_SCALE resolution and scaled up; its soft edges hide the difference. */
const DARKNESS_SCALE = 2;

/**
 * Screen-space darkness with soft holes cut around light sources. Redrawn each frame at reduced
 * resolution (for performance); lights are given in world coordinates and culled when off-screen.
 */
export class DarknessOverlay {
  private readonly texture: Phaser.GameObjects.RenderTexture;
  private readonly brush: Phaser.GameObjects.Image;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly settings: DarknessSettings,
  ) {
    this.texture = scene.add
      .renderTexture(0, 0, GAME_WIDTH / DARKNESS_SCALE, GAME_HEIGHT / DARKNESS_SCALE)
      .setOrigin(0)
      .setScrollFactor(0)
      .setScale(DARKNESS_SCALE)
      .setDepth(40);
    this.brush = scene.make.image({ key: TextureKeys.LightLarge }, false).setOrigin(0.5);
  }

  get playerLightRadius(): number {
    return this.settings.playerLightRadius;
  }

  render(lights: readonly LightSource[]): void {
    const cam = this.scene.cameras.main;
    this.texture.clear();
    this.texture.fill(0x05030a, this.settings.ambientAlpha);
    for (const light of lights) {
      const sx = light.x - cam.scrollX;
      const sy = light.y - cam.scrollY;
      if (sx < -light.radius || sx > GAME_WIDTH + light.radius || sy < -light.radius || sy > GAME_HEIGHT + light.radius) continue;
      this.brush.setScale(light.radius / LIGHT_LARGE_RADIUS / DARKNESS_SCALE);
      this.texture.erase(this.brush, sx / DARKNESS_SCALE, sy / DARKNESS_SCALE);
    }
  }
}
