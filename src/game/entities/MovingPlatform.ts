import Phaser from 'phaser';
import { TILE_SIZE } from '../config/constants';
import { TextureKeys } from '../config/textureKeys';
import type { MovingPlatformPlacement } from '../levels/types';
import { movingPlatformTilePosition } from '../systems/movingPlatform';

/**
 * Immovable, gravity-free platform following its eased ping-pong path on the game clock.
 * It is driven by velocity (not by teleporting) so Arcade physics carries riders with it.
 */
export class MovingPlatform extends Phaser.GameObjects.TileSprite {
  declare body: Phaser.Physics.Arcade.Body;

  constructor(
    scene: Phaser.Scene,
    readonly placement: MovingPlatformPlacement,
  ) {
    super(scene, placement.x * TILE_SIZE, placement.y * TILE_SIZE, placement.width * TILE_SIZE, TILE_SIZE, TextureKeys.MovingPlatform);
    this.setOrigin(0).setDepth(1);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setAllowGravity(false).setImmovable(true);
    this.body.pushable = false;
    this.body.setFriction(1, 0);
    this.syncTo(0);
  }

  /** Snaps to the path position at `clockMs` (used on creation). */
  syncTo(clockMs: number): void {
    const p = movingPlatformTilePosition(this.placement, clockMs);
    this.body.reset(p.x * TILE_SIZE, p.y * TILE_SIZE);
  }

  /** Sets velocity so the platform arrives at its path position for the next frame. */
  tick(clockMs: number, deltaMs: number): void {
    if (deltaMs <= 0) return;
    const target = movingPlatformTilePosition(this.placement, clockMs + deltaMs);
    const dt = deltaMs / 1000;
    this.body.setVelocity((target.x * TILE_SIZE - this.body.x) / dt, (target.y * TILE_SIZE - this.body.y) / dt);
  }

  stop(): void {
    this.body.setVelocity(0, 0);
  }
}
