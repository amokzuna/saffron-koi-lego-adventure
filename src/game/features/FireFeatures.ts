import Phaser from 'phaser';
import { TILE_SIZE } from '../config/constants';
import { TextureKeys } from '../config/textureKeys';
import type { FlameJetPlacement, TimedPlatformPlacement } from '../levels/types';
import type { LightSource } from '../systems/DarknessOverlay';
import { flamePhase, timedPhase } from '../systems/environment';
import type { FeatureContext, LevelFeature } from './LevelFeature';

/** Flame jets (smoke warning, then fire) and timed platforms (blink, vanish, return). */
export class FireFeature implements LevelFeature {
  private readonly jets: { placement: FlameJetPlacement; flame: Phaser.GameObjects.TileSprite; smoke: Phaser.GameObjects.Image; zone: Phaser.GameObjects.Zone }[] = [];
  private readonly timed: { placement: TimedPlatformPlacement; visual: Phaser.GameObjects.TileSprite; zone: Phaser.GameObjects.Zone }[] = [];

  constructor(ctx: FeatureContext) {
    const { scene, level, player } = ctx;
    const flameZones: Phaser.GameObjects.Zone[] = [];
    for (const jet of level.flameJets ?? []) {
      const cx = jet.x * TILE_SIZE + TILE_SIZE / 2;
      const baseY = (jet.y + 1) * TILE_SIZE;
      const h = jet.height * TILE_SIZE;
      scene.add.image(cx, baseY, TextureKeys.FlameNozzle).setOrigin(0.5, 1).setDepth(4);
      const flame = scene.add.tileSprite(cx, baseY - 12, 28, h, TextureKeys.Flame).setOrigin(0.5, 1).setDepth(4).setVisible(false);
      const smoke = scene.add.image(cx, baseY - 18, TextureKeys.Smoke).setOrigin(0.5, 1).setDepth(4).setVisible(false);
      // Hitbox narrower than the art.
      const zone = scene.add.zone(cx - 9, baseY - 12 - h, 18, h).setOrigin(0);
      scene.physics.add.existing(zone, true);
      (zone.body as Phaser.Physics.Arcade.StaticBody).enable = false;
      flameZones.push(zone);
      this.jets.push({ placement: jet, flame, smoke, zone });
    }
    scene.physics.add.overlap(player, flameZones, (_p, z) => ctx.hurtPlayer((z as Phaser.GameObjects.Zone).x + 9));

    const timedZones: Phaser.GameObjects.Zone[] = [];
    for (const p of level.timedPlatforms ?? []) {
      const x = p.x * TILE_SIZE;
      const y = p.y * TILE_SIZE;
      const w = p.width * TILE_SIZE;
      const visual = scene.add.tileSprite(x, y, w, TILE_SIZE, TextureKeys.TimedPlatform).setOrigin(0).setDepth(1);
      const zone = scene.add.zone(x, y, w, TILE_SIZE).setOrigin(0);
      scene.physics.add.existing(zone, true);
      timedZones.push(zone);
      this.timed.push({ placement: p, visual, zone });
    }
    scene.physics.add.collider(player, timedZones);
  }

  update(clockMs: number): void {
    for (const jet of this.jets) {
      const phase = flamePhase(jet.placement, clockMs);
      jet.flame.setVisible(phase === 'on');
      jet.flame.tilePositionY -= 4;
      jet.smoke.setVisible(phase === 'warning').setAlpha(0.5 + Math.sin(clockMs / 60) * 0.3);
      (jet.zone.body as Phaser.Physics.Arcade.StaticBody).enable = phase === 'on';
    }
    for (const t of this.timed) {
      const phase = timedPhase(t.placement, clockMs);
      const body = t.zone.body as Phaser.Physics.Arcade.StaticBody;
      body.enable = phase !== 'gone';
      t.visual.setVisible(phase !== 'gone');
      t.visual.setAlpha(phase === 'blinking' ? (Math.floor(clockMs / 90) % 2 ? 0.35 : 1) : 1);
    }
  }

  lights(): LightSource[] {
    return this.jets.map((j) => ({ x: j.flame.x, y: j.flame.y - 20, radius: 70 }));
  }
}
