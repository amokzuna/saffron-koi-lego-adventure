import { shake } from '../systems/fx';
import Phaser from 'phaser';
import { TILE_SIZE } from '../config/constants';
import { TextureKeys } from '../config/textureKeys';
import { themedKey } from '../config/themes';
import { tileToFeet } from '../levels/buildLevel';
import type { DoorPlacement } from '../levels/types';
import type { FeatureContext, LevelFeature } from './LevelFeature';

/**
 * Pressure switches open linked doors permanently (for this attempt). Secret walls look solid but can be
 * walked through, fading while the player is inside them.
 */
export class SwitchesAndDoorsFeature implements LevelFeature {
  private readonly doors = new Map<string, { placement: DoorPlacement; zone: Phaser.GameObjects.Zone; visual: Phaser.GameObjects.TileSprite }[]>();
  private readonly secrets: { rect: Phaser.Geom.Rectangle; visual: Phaser.GameObjects.TileSprite }[] = [];

  constructor(private readonly ctx: FeatureContext) {
    const { scene, level, player } = ctx;
    const doorGroup = scene.physics.add.staticGroup();
    for (const door of level.doors ?? []) {
      const x = door.x * TILE_SIZE;
      const y = door.y * TILE_SIZE;
      const w = door.width * TILE_SIZE;
      const h = door.height * TILE_SIZE;
      const visual = scene.add.tileSprite(x, y, w, h, TextureKeys.Door).setOrigin(0).setDepth(2);
      const zone = scene.add.zone(x, y, w, h).setOrigin(0);
      doorGroup.add(zone);
      const list = this.doors.get(door.switchId) ?? [];
      list.push({ placement: door, zone, visual });
      this.doors.set(door.switchId, list);
    }
    doorGroup.refresh();
    scene.physics.add.collider(player, doorGroup);

    const switchGroup = scene.physics.add.staticGroup();
    for (const sw of level.switches ?? []) {
      const feet = tileToFeet(sw);
      const image = switchGroup.create(feet.x, feet.y, TextureKeys.SwitchUp) as Phaser.Physics.Arcade.Image;
      image.setOrigin(0.5, 1).setDepth(3).setData('switchId', sw.id).refreshBody();
    }
    scene.physics.add.overlap(player, switchGroup, (_p, sw) => this.press(sw as Phaser.Physics.Arcade.Image));

    for (const secret of level.secrets ?? []) {
      const rect = new Phaser.Geom.Rectangle(secret.x * TILE_SIZE, secret.y * TILE_SIZE, secret.width * TILE_SIZE, secret.height * TILE_SIZE);
      const visual = scene.add
        .tileSprite(rect.x, rect.y, rect.width, rect.height, themedKey(TextureKeys.GroundFill, level.theme))
        .setOrigin(0)
        .setDepth(12);
      this.secrets.push({ rect, visual });
    }
  }

  private press(sw: Phaser.Physics.Arcade.Image): void {
    const id = sw.getData('switchId') as string;
    if (sw.getData('pressed')) return;
    sw.setData('pressed', true).setTexture(TextureKeys.SwitchDown);
    const doors = this.doors.get(id) ?? [];
    for (const door of doors) {
      (door.zone.body as Phaser.Physics.Arcade.StaticBody).enable = false;
      this.ctx.scene.tweens.add({ targets: door.visual, alpha: 0, y: door.visual.y - TILE_SIZE, duration: 500, onComplete: () => door.visual.destroy() });
    }
    shake(this.ctx.scene, 150, 0.004);
    this.ctx.sound(doors.length > 0 ? 'door' : 'checkpoint');
    this.ctx.floatText(sw.x, sw.y - 30, doors.length > 0 ? 'A DOOR OPENED!' : 'CLICK!', '#ffe680');
  }

  update(): void {
    const bounds = this.ctx.player.getBounds();
    for (const s of this.secrets) {
      const inside = Phaser.Geom.Intersects.RectangleToRectangle(bounds, s.rect);
      s.visual.setAlpha(Phaser.Math.Linear(s.visual.alpha, inside ? 0.25 : 1, 0.2));
    }
  }
}
