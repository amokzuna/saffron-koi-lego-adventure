import Phaser from 'phaser';
import { TILE_SIZE } from '../config/constants';
import { TextureKeys } from '../config/textureKeys';
import { CrumbleTile, type CrumbleState } from '../systems/crumble';

/** One crumbling plank tile; timing rules live in CrumbleTile. */
export class CrumblePlank extends Phaser.Physics.Arcade.Image {
  declare body: Phaser.Physics.Arcade.StaticBody;
  readonly tile = new CrumbleTile();
  private readonly homeX: number;
  private readonly homeY: number;

  constructor(scene: Phaser.Scene, tileX: number, tileY: number) {
    super(scene, tileX * TILE_SIZE, tileY * TILE_SIZE, TextureKeys.Crumble);
    this.homeX = tileX * TILE_SIZE;
    this.homeY = tileY * TILE_SIZE;
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.setOrigin(0).setDepth(1);
    this.body.updateFromGameObject();
  }

  /** Advances the plank; `occupied` blocks respawning while something overlaps the plank's space. */
  step(deltaMs: number, occupied: boolean): CrumbleState | null {
    const changed = this.tile.update(deltaMs, occupied);
    if (this.tile.state === 'shaking') {
      this.x = this.homeX + (Math.floor(this.scene.time.now / 40) % 2 === 0 ? -1.5 : 1.5);
    }
    if (changed === 'fallen') {
      this.body.enable = false;
      this.x = this.homeX;
      this.scene.tweens.add({ targets: this, y: this.homeY + 60, alpha: 0, angle: 12, duration: 350, ease: 'Quad.easeIn' });
    } else if (changed === 'solid') {
      this.scene.tweens.killTweensOf(this);
      this.setPosition(this.homeX, this.homeY).setAngle(0).setAlpha(0);
      this.scene.tweens.add({ targets: this, alpha: 1, duration: 250 });
      this.body.enable = true;
      this.body.updateFromGameObject();
    }
    return changed;
  }

  get rect(): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(this.homeX, this.homeY, TILE_SIZE, TILE_SIZE / 2);
  }
}
