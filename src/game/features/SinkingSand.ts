import Phaser from 'phaser';
import { TILE_SIZE } from '../config/constants';
import { TextureKeys } from '../config/textureKeys';
import type { SinkingPlatformPlacement } from '../levels/types';
import { sinkStep } from '../systems/environment';
import type { FeatureContext, LevelFeature } from './LevelFeature';

class SinkingPlatform extends Phaser.GameObjects.TileSprite {
  declare body: Phaser.Physics.Arcade.Body;
  offset = 0;
  stoodOn = false;
  readonly homeY: number;

  constructor(scene: Phaser.Scene, readonly placement: SinkingPlatformPlacement) {
    super(scene, placement.x * TILE_SIZE, placement.y * TILE_SIZE, placement.width * TILE_SIZE, TILE_SIZE, TextureKeys.SinkSand);
    this.homeY = placement.y * TILE_SIZE;
    this.setOrigin(0).setDepth(1);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setAllowGravity(false).setImmovable(true);
    this.body.pushable = false;
  }
}

/** Sand platforms that sink while stood on and rise back when free. */
export class SinkingSandFeature implements LevelFeature {
  private readonly platforms: SinkingPlatform[];

  constructor(ctx: FeatureContext) {
    this.platforms = (ctx.level.sinkingPlatforms ?? []).map((p) => new SinkingPlatform(ctx.scene, p));
    ctx.scene.physics.add.collider(ctx.player, this.platforms, (_p, platform) => {
      if (ctx.player.body.touching.down) (platform as SinkingPlatform).stoodOn = true;
    });
  }

  update(_clockMs: number, deltaMs: number): void {
    if (deltaMs <= 0) return;
    for (const p of this.platforms) {
      p.offset = sinkStep(p.offset, p.stoodOn, deltaMs, p.placement.maxDrop * TILE_SIZE);
      p.stoodOn = false;
      p.body.setVelocityY((p.homeY + p.offset - p.body.y) / (deltaMs / 1000));
    }
  }
}
