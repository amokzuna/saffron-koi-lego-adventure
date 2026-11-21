import Phaser from 'phaser';
import { TILE_SIZE } from '../config/constants';
import { GAMEPLAY } from '../config/gameplay';
import { AnimationKeys, TextureKeys } from '../config/textureKeys';
import type { EnemyPlacement } from '../levels/types';
import { nextPatrolDirection } from '../systems/combat';
import { HopTimer } from '../systems/hopper';

/**
 * Base class for simple patrolling enemies. Subclasses define movement; the scene
 * handles player contact (stomp vs. hit) using the shared combat helpers.
 */
export abstract class Enemy extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;
  protected direction: -1 | 1 = -1;
  protected readonly minX: number;
  protected readonly maxX: number;
  private defeated = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    readonly placement: EnemyPlacement,
  ) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.minX = placement.patrolMinX * TILE_SIZE + TILE_SIZE / 2;
    this.maxX = placement.patrolMaxX * TILE_SIZE + TILE_SIZE / 2;
    this.setDepth(5);
  }

  get isAlive(): boolean {
    return !this.defeated;
  }

  abstract tick(clockMs: number, deltaMs: number): void;

  protected patrol(speed: number): void {
    this.direction = nextPatrolDirection({
      x: this.x,
      direction: this.direction,
      minX: this.minX,
      maxX: this.maxX,
      blockedLeft: this.body.blocked.left,
      blockedRight: this.body.blocked.right,
    });
    this.body.setVelocityX(this.direction * speed);
    // Art faces left by default.
    this.setFlipX(this.direction === 1);
  }

  /** Squash-and-remove when stomped. */
  defeat(): void {
    if (this.defeated) return;
    this.defeated = true;
    this.body.enable = false;
    this.anims.stop();
    this.scene.tweens.add({
      targets: this,
      scaleY: 0.2,
      alpha: 0,
      y: this.y + this.displayHeight * 0.4,
      duration: 250,
      ease: 'Quad.easeIn',
      onComplete: () => this.destroy(),
    });
  }
}

/** Ground patroller affected by gravity; turns at patrol bounds and walls. */
export class WalkerEnemy extends Enemy {
  constructor(scene: Phaser.Scene, placement: EnemyPlacement) {
    const x = placement.x * TILE_SIZE + TILE_SIZE / 2;
    const feetY = (placement.y + 1) * TILE_SIZE;
    super(scene, x, feetY, TextureKeys.Walker0, placement);
    this.setOrigin(0.5, 1);
    this.body.setSize(28, 22).setOffset(2, 6);
    this.body.setMaxVelocityY(900);
    this.play(AnimationKeys.WalkerWalk);
  }

  tick(): void {
    if (this.isAlive) this.patrol(GAMEPLAY.walkerSpeed);
  }
}

/** Hovering patroller: ignores gravity and solids, bobs vertically on a sine wave. */
export class FlyerEnemy extends Enemy {
  private readonly baseY: number;

  constructor(scene: Phaser.Scene, placement: EnemyPlacement) {
    const x = placement.x * TILE_SIZE + TILE_SIZE / 2;
    const y = placement.y * TILE_SIZE + TILE_SIZE / 2;
    super(scene, x, y, TextureKeys.Flyer0, placement);
    this.baseY = y;
    this.body.setAllowGravity(false);
    this.body.setSize(20, 18).setOffset(6, 6);
    this.play(AnimationKeys.FlyerFlap);
  }

  tick(clockMs: number): void {
    if (!this.isAlive) return;
    this.patrol(GAMEPLAY.flyerSpeed);
    // Drive the bob through velocity (physics owns position): sine derivative plus drift correction.
    const omega = (Math.PI * 2) / GAMEPLAY.flyerBobPeriodMs;
    const phase = clockMs * omega;
    const targetY = this.baseY + Math.sin(phase) * GAMEPLAY.flyerBobAmplitudePx;
    const vy = Math.cos(phase) * GAMEPLAY.flyerBobAmplitudePx * omega * 1000 + (targetY - this.y) * 5;
    this.body.setVelocityY(vy);
  }
}

/** Spore Hopper: rests, then hops along its patrol range. Readable rhythm; stompable like other enemies. */
export class HopperEnemy extends Enemy {
  private readonly timer: HopTimer;

  constructor(scene: Phaser.Scene, placement: EnemyPlacement) {
    const x = placement.x * TILE_SIZE + TILE_SIZE / 2;
    const feetY = (placement.y + 1) * TILE_SIZE;
    super(scene, x, feetY, TextureKeys.Hopper0, placement);
    this.setOrigin(0.5, 1);
    this.body.setSize(24, 22).setOffset(4, 10);
    this.body.setMaxVelocityY(900);
    // Offset start times by position so neighbouring hoppers don't hop in unison.
    this.timer = new HopTimer(GAMEPLAY.hopperRestMs, (placement.x * 173) % GAMEPLAY.hopperRestMs);
  }

  tick(_clockMs: number, deltaMs: number): void {
    if (!this.isAlive) return;
    const onGround = this.body.blocked.down;
    if (onGround) {
      this.body.setVelocityX(0);
      if (this.timer.update(deltaMs, true)) {
        this.direction = nextPatrolDirection({
          x: this.x,
          direction: this.direction,
          minX: this.minX,
          maxX: this.maxX,
          blockedLeft: this.body.blocked.left,
          blockedRight: this.body.blocked.right,
        });
        this.body.setVelocity(this.direction * GAMEPLAY.hopperSpeedX, -GAMEPLAY.hopperJumpVelocity);
        this.setFlipX(this.direction === 1);
      }
    } else if ((this.direction === 1 && this.x >= this.maxX) || (this.direction === -1 && this.x <= this.minX)) {
      this.body.setVelocityX(0);
    }
    this.setTexture(onGround ? TextureKeys.Hopper0 : TextureKeys.Hopper1);
  }
}

export function createEnemy(scene: Phaser.Scene, placement: EnemyPlacement): Enemy {
  switch (placement.kind) {
    case 'walker':
      return new WalkerEnemy(scene, placement);
    case 'flyer':
      return new FlyerEnemy(scene, placement);
    case 'hopper':
      return new HopperEnemy(scene, placement);
  }
}
