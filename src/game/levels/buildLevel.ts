import Phaser from 'phaser';
import { TILE_SIZE } from '../config/constants';
import { POWER_UP_TEXTURES, TextureKeys } from '../config/textureKeys';
import { themedKey } from '../config/themes';
import type {
  CheckpointPlacement,
  CollectiblePlacement,
  DecorationPlacement,
  HazardPlacement,
  LevelDefinition,
  PowerUpPlacement,
  SolidBlock,
  ThemeId,
  TilePoint,
} from './types';

/** Converts a tile point to the world position where something standing on that tile has its feet. */
export function tileToFeet(p: TilePoint): { x: number; y: number } {
  return { x: p.x * TILE_SIZE + TILE_SIZE / 2, y: (p.y + 1) * TILE_SIZE };
}

export function tileToCenter(p: TilePoint): { x: number; y: number } {
  return { x: p.x * TILE_SIZE + TILE_SIZE / 2, y: p.y * TILE_SIZE + TILE_SIZE / 2 };
}

/** Creates one static physics body per solid block, with tiled visuals. */
export function buildSolids(scene: Phaser.Scene, solids: readonly SolidBlock[], theme: ThemeId): Phaser.Physics.Arcade.StaticGroup {
  const group = scene.physics.add.staticGroup();
  for (const block of solids) {
    const x = block.x * TILE_SIZE;
    const y = block.y * TILE_SIZE;
    const w = block.width * TILE_SIZE;
    const h = block.height * TILE_SIZE;

    if (block.style === 'platform') {
      scene.add.tileSprite(x, y, w, TILE_SIZE, themedKey(TextureKeys.Platform, theme)).setOrigin(0);
    } else if (block.style === 'bridge') {
      scene.add.tileSprite(x, y, w, h, TextureKeys.Bridge).setOrigin(0);
    } else if (block.style === 'ice') {
      scene.add.tileSprite(x, y, w, h, TextureKeys.Ice).setOrigin(0);
    } else {
      scene.add.tileSprite(x, y, w, TILE_SIZE, themedKey(TextureKeys.GroundTop, theme)).setOrigin(0);
      if (h > TILE_SIZE) scene.add.tileSprite(x, y + TILE_SIZE, w, h - TILE_SIZE, themedKey(TextureKeys.GroundFill, theme)).setOrigin(0);
    }

    const zone = scene.add.zone(x, y, w, h).setOrigin(0);
    if (block.style === 'ice') zone.setData('surface', 'ice');
    group.add(zone);
  }
  group.refresh();
  return group;
}

export interface CollectibleSprite extends Phaser.Physics.Arcade.Image {
  getData(key: 'placement'): CollectiblePlacement;
}

export function buildCollectibles(scene: Phaser.Scene, placements: readonly CollectiblePlacement[]): Phaser.Physics.Arcade.StaticGroup {
  const group = scene.physics.add.staticGroup();
  for (const placement of placements) {
    const { x, y } = tileToCenter(placement);
    const texture = placement.kind === 'coin' ? TextureKeys.Coin : TextureKeys.Brick;
    const sprite = group.create(x, y, texture) as Phaser.Physics.Arcade.Image;
    sprite.setData('placement', placement);
    // Gentle bob to signal interactivity. Static bodies don't move, so the hitbox stays put.
    scene.tweens.add({
      targets: sprite,
      y: y - 4,
      duration: 700 + (placement.x % 5) * 60,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
  return group;
}

export function buildGoal(scene: Phaser.Scene, level: LevelDefinition): Phaser.Physics.Arcade.Image {
  const feet = tileToFeet(level.goal);
  const goal = scene.physics.add.staticImage(feet.x, feet.y, TextureKeys.GoalFlag).setOrigin(0.5, 1);
  goal.refreshBody();
  // Tall, narrow trigger along the pole so touching it anywhere counts.
  goal.body.setSize(24, goal.height);
  return goal;
}

export function buildHazards(scene: Phaser.Scene, hazards: readonly HazardPlacement[]): Phaser.Physics.Arcade.StaticGroup {
  const group = scene.physics.add.staticGroup();
  for (const hazard of hazards) {
    const x = hazard.x * TILE_SIZE;
    const y = hazard.y * TILE_SIZE;
    const w = hazard.width * TILE_SIZE;
    if (hazard.kind === 'lava') {
      const lava = scene.add.tileSprite(x, y + 6, w, TILE_SIZE - 6, TextureKeys.Lava).setOrigin(0).setDepth(2);
      scene.tweens.add({ targets: lava, tilePositionX: 32, duration: 1600, repeat: -1 });
      const zone = scene.add.zone(x + 2, y + 12, w - 4, TILE_SIZE - 12).setOrigin(0).setData('kind', 'lava');
      group.add(zone);
      continue;
    }
    scene.add.tileSprite(x, y, w, TILE_SIZE, TextureKeys.Spikes).setOrigin(0).setDepth(2);
    // Hitbox covers the lower part of the spikes, inset at the edges, so grazing a tip is forgiven.
    const zone = scene.add.zone(x + 4, y + 14, w - 8, TILE_SIZE - 14).setOrigin(0).setData('kind', 'spikes');
    group.add(zone);
  }
  group.refresh();
  return group;
}

export function buildCheckpoints(scene: Phaser.Scene, checkpoints: readonly CheckpointPlacement[]): Phaser.Physics.Arcade.StaticGroup {
  const group = scene.physics.add.staticGroup();
  for (const checkpoint of checkpoints) {
    const feet = tileToFeet(checkpoint);
    const sprite = group.create(feet.x, feet.y, TextureKeys.CheckpointIdle) as Phaser.Physics.Arcade.Image;
    sprite.setOrigin(0.5, 1).setDepth(3).setData('checkpointId', checkpoint.id);
    sprite.refreshBody();
  }
  return group;
}

export function buildPowerUps(scene: Phaser.Scene, powerUps: readonly PowerUpPlacement[]): Phaser.Physics.Arcade.StaticGroup {
  const group = scene.physics.add.staticGroup();
  for (const powerUp of powerUps) {
    const { x, y } = tileToCenter(powerUp);
    const sprite = group.create(x, y, POWER_UP_TEXTURES[powerUp.kind]) as Phaser.Physics.Arcade.Image;
    sprite.setData('placement', powerUp).setDepth(4);
    scene.tweens.add({ targets: sprite, y: y - 5, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    scene.tweens.add({ targets: sprite, angle: { from: -6, to: 6 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }
  return group;
}

const DECORATION_TEXTURES = {
  bush: TextureKeys.Bush,
  flower: TextureKeys.Flower,
  mushroom: TextureKeys.Mushroom,
  glowMushroom: TextureKeys.GlowMushroom,
} as const;

/** Non-colliding scenery and tutorial signs. */
export function buildDecorations(scene: Phaser.Scene, decorations: readonly DecorationPlacement[]): void {
  for (const d of decorations) {
    const feet = tileToFeet(d);
    if (d.kind === 'sign') {
      scene.add.image(feet.x, feet.y, TextureKeys.SignPost).setOrigin(0.5, 1).setDepth(-1);
      scene.add
        .text(feet.x, feet.y - 28, d.text ?? '', {
          fontFamily: '"Trebuchet MS", system-ui, sans-serif',
          fontSize: '14px',
          fontStyle: 'bold',
          color: '#fff8e1',
          backgroundColor: '#7a4b24',
          padding: { x: 8, y: 5 },
          align: 'center',
          wordWrap: { width: 170 },
        })
        .setOrigin(0.5, 1)
        .setDepth(-1);
    } else {
      scene.add.image(feet.x, feet.y, DECORATION_TEXTURES[d.kind]).setOrigin(0.5, 1).setDepth(-1);
    }
  }
}
