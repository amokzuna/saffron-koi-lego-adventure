import type Phaser from 'phaser';
import { TILE_SIZE } from '../config/constants';
import { GAME_HEIGHT } from '../config/constants';
import { TextureKeys } from '../config/textureKeys';
import type { WindZonePlacement } from '../levels/types';
import { windForce, windPhase } from '../systems/environment';
import type { FeatureContext, LevelFeature } from './LevelFeature';

/** Desert gusts: visible streaks warn before each gust; during a gust the player is pushed sideways. */
export class WindFeature implements LevelFeature {
  private readonly zones: { placement: WindZonePlacement; streaks: Phaser.GameObjects.TileSprite }[];
  private push = 0;

  constructor(private readonly ctx: FeatureContext) {
    this.zones = (ctx.level.windZones ?? []).map((placement) => ({
      placement,
      streaks: ctx.scene.add
        .tileSprite(placement.x * TILE_SIZE, 0, placement.width * TILE_SIZE, GAME_HEIGHT, TextureKeys.WindStreak)
        .setOrigin(0)
        .setDepth(15)
        .setAlpha(0)
        .setFlipX(placement.force < 0),
    }));
  }

  update(clockMs: number, deltaMs: number): void {
    const px = this.ctx.player.x;
    this.push = 0;
    for (const { placement, streaks } of this.zones) {
      const phase = windPhase(placement, clockMs);
      streaks.setAlpha(phase === 'gust' ? 0.9 : phase === 'warning' ? 0.35 : 0);
      streaks.tilePositionX -= Math.sign(placement.force) * deltaMs * (phase === 'gust' ? 0.9 : 0.3);
      const left = placement.x * TILE_SIZE;
      if (px >= left && px < left + placement.width * TILE_SIZE) this.push += windForce(placement, clockMs);
    }
  }

  playerPush(): number {
    return this.push;
  }
}
