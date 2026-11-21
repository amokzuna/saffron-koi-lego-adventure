import Phaser from 'phaser';
import { TILE_SIZE } from '../../config/constants';
import type { BossPlacement } from '../../levels/types';
import type { StompResult } from '../../systems/BossBrain';

/** Hazards a boss asks the scene to create. All are telegraphed by the boss before they appear. */
export type BossSpawn =
  | { kind: 'shockwave'; x: number; y: number; speed: number }
  | { kind: 'boulder'; x: number }
  | { kind: 'eruption'; x0: number; x1: number; y: number; durationMs: number };

export interface BossTickResult {
  /** Semantic transitions the scene reacts to (camera shake, text, goal reveal). */
  entered: 'vulnerable' | 'defeated' | null;
  spawns: BossSpawn[];
}

/**
 * Shared boss behavior: arena geometry, warning icon, reset and defeat sequences.
 * Subclasses wrap a pure "brain" state machine and translate its decisions into physics and visuals.
 */
export abstract class BossBase extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;
  protected readonly startX: number;
  protected readonly startY: number;
  /** Arena interior in px (the gate occupies the arenaMinX column). */
  readonly innerMinX: number;
  readonly innerMaxX: number;
  protected readonly warning: Phaser.GameObjects.Text;

  constructor(
    scene: Phaser.Scene,
    readonly placement: BossPlacement,
    texture: string,
  ) {
    const x = placement.x * TILE_SIZE + TILE_SIZE / 2;
    const y = (placement.y + 1) * TILE_SIZE;
    super(scene, x, y, texture);
    this.startX = x;
    this.startY = y;
    this.innerMinX = (placement.arenaMinX + 1) * TILE_SIZE;
    this.innerMaxX = (placement.arenaMaxX + 1) * TILE_SIZE;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setOrigin(0.5, 1).setDepth(6);
    this.body.setCollideWorldBounds(true);
    this.warning = scene.add
      .text(x, y - 80, '!', { fontFamily: 'Trebuchet MS, sans-serif', fontSize: '32px', fontStyle: 'bold', color: '#ff3b30', stroke: '#fff', strokeThickness: 5 })
      .setOrigin(0.5, 1)
      .setDepth(20)
      .setVisible(false);
  }

  abstract get hp(): number;
  abstract get maxHp(): number;
  abstract get touchHurtsPlayer(): boolean;
  /** Short text shown when the boss becomes vulnerable. */
  abstract readonly vulnerableText: string;
  abstract activate(): void;
  abstract stomp(): StompResult;
  abstract tick(deltaMs: number, playerX: number): BossTickResult;
  protected abstract resetBrain(): void;

  protected showWarning(visible: boolean): void {
    this.warning.setPosition(this.x, this.y - this.displayHeight - 6).setVisible(visible);
  }

  /** Back to the starting position, dormant and at full health (used when the player continues). */
  resetFight(): void {
    this.resetBrain();
    this.body.reset(this.startX, this.startY);
    this.body.enable = true;
    this.setVisible(true).setAlpha(1).setAngle(0).clearTint();
    this.warning.setVisible(false);
  }

  /** Defeat sequence: topple and fade, then hide. */
  playDefeat(onDone: () => void): void {
    this.body.enable = false;
    this.warning.setVisible(false);
    this.scene.tweens.add({
      targets: this,
      angle: this.flipX ? 90 : -90,
      alpha: 0,
      y: this.y + 10,
      duration: 900,
      ease: 'Quad.easeIn',
      onComplete: () => {
        this.setVisible(false);
        onDone();
      },
    });
  }
}
