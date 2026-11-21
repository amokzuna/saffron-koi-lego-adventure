import Phaser from 'phaser';
import { TILE_SIZE } from '../config/constants';
import { TextureKeys } from '../config/textureKeys';
import type { MovingHazardPlacement } from '../levels/types';
import { pingPongProgress } from '../systems/movingPlatform';

/** Spiked ball following an eased ping-pong path (same timing model as moving platforms). */
export class MovingHazard extends Phaser.Physics.Arcade.Image {
  declare body: Phaser.Physics.Arcade.Body;

  constructor(
    scene: Phaser.Scene,
    readonly placement: MovingHazardPlacement,
  ) {
    super(scene, 0, 0, TextureKeys.SpikeBall);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(7);
    this.body.setAllowGravity(false);
    // Circular hitbox slightly smaller than the art, so grazing a spike tip is forgiven.
    this.body.setCircle(12, 6, 6);
    const start = this.positionAt(0);
    this.body.reset(start.x, start.y);
  }

  private positionAt(clockMs: number): { x: number; y: number } {
    const p = this.placement;
    const k = pingPongProgress(clockMs, p.periodMs, p.phaseMs);
    return { x: (p.x + p.dx * k) * TILE_SIZE + TILE_SIZE / 2, y: (p.y + p.dy * k) * TILE_SIZE + TILE_SIZE / 2 };
  }

  tick(clockMs: number, deltaMs: number): void {
    if (deltaMs <= 0) return;
    const target = this.positionAt(clockMs + deltaMs);
    const dt = deltaMs / 1000;
    this.body.setVelocity((target.x - this.x) / dt, (target.y - this.y) / dt);
    this.rotation += deltaMs * 0.004;
  }
}
