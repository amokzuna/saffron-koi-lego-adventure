import Phaser from 'phaser';
import { TILE_SIZE } from '../config/constants';
import { TextureKeys } from '../config/textureKeys';
import { ICICLE_TRIGGER_PX, IcicleBrain } from '../systems/environment';
import type { FeatureContext, LevelFeature } from './LevelFeature';

/** Boost pads launch the player; icicles shake when the player passes beneath, then fall and regrow. */
export class IceFeature implements LevelFeature {
  private readonly icicles: { brain: IcicleBrain; sprite: Phaser.Physics.Arcade.Image; homeX: number; homeY: number }[] = [];

  constructor(private readonly ctx: FeatureContext) {
    const { scene, level, player } = ctx;

    const pads = scene.physics.add.staticGroup();
    for (const pad of level.boostPads ?? []) {
      for (let i = 0; i < pad.width; i++) {
        const x = (pad.x + i) * TILE_SIZE + TILE_SIZE / 2;
        const y = (pad.y + 1) * TILE_SIZE;
        const image = pads.create(x, y, TextureKeys.BoostPad) as Phaser.Physics.Arcade.Image;
        image.setOrigin(0.5, 1).setDepth(3).setFlipX(pad.direction < 0).setData('direction', pad.direction).refreshBody();
      }
    }
    scene.physics.add.overlap(player, pads, (_p, pad) => {
      if (player.onGround) player.boost((pad as Phaser.Physics.Arcade.Image).getData('direction') as -1 | 1);
    });

    for (const placement of level.icicles ?? []) {
      const homeX = placement.x * TILE_SIZE + TILE_SIZE / 2;
      const homeY = placement.y * TILE_SIZE;
      const sprite = scene.physics.add.image(homeX, homeY, TextureKeys.Icicle).setOrigin(0.5, 0).setDepth(5);
      sprite.body.setAllowGravity(false).setSize(12, 30).setOffset(4, 2);
      this.icicles.push({ brain: new IcicleBrain(), sprite, homeX, homeY });
    }
    const sprites = this.icicles.map((i) => i.sprite);
    scene.physics.add.overlap(player, sprites, (_p, s) => {
      const icicle = this.icicles.find((i) => i.sprite === s);
      if (icicle?.brain.state === 'falling') ctx.hurtPlayer(icicle.sprite.x);
    });
    scene.physics.add.collider(sprites, ctx.solids, (s) => this.icicles.find((i) => i.sprite === s)?.brain.landed());
  }

  update(_clockMs: number, deltaMs: number): void {
    const { player } = this.ctx;
    for (const icicle of this.icicles) {
      const beneath = Math.abs(player.x - icicle.homeX) < ICICLE_TRIGGER_PX && player.y > icicle.homeY;
      const changed = icicle.brain.update(deltaMs, beneath);
      const { sprite } = icicle;
      const body = sprite.body as Phaser.Physics.Arcade.Body;
      if (icicle.brain.state === 'shaking') sprite.x = icicle.homeX + (Math.floor(this.ctx.scene.time.now / 50) % 2 ? -2 : 2);
      if (changed === 'falling') {
        sprite.x = icicle.homeX;
        body.setAllowGravity(true);
      } else if (changed === 'hanging') {
        body.reset(icicle.homeX, icicle.homeY);
        body.setAllowGravity(false);
        sprite.setVisible(true).setAlpha(0);
        this.ctx.scene.tweens.add({ targets: sprite, alpha: 1, duration: 400 });
      }
      if (icicle.brain.state === 'gone' && sprite.visible) {
        body.setAllowGravity(false).setVelocity(0, 0);
        sprite.setVisible(false);
        this.ctx.floatText(sprite.x, sprite.y, '✶', '#e6f7ff');
      }
    }
  }
}
