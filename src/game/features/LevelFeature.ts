import type Phaser from 'phaser';
import type { SoundId } from '../../features/audio/sounds';
import type { Player } from '../entities/Player';
import type { LevelDefinition } from '../levels/types';
import type { LightSource } from '../systems/DarknessOverlay';
import type { LevelSession } from '../systems/LevelSession';

/** What a level mechanic may use from the scene. Keeps mechanics independent of LevelScene internals. */
export interface FeatureContext {
  scene: Phaser.Scene;
  level: LevelDefinition;
  player: Player;
  session: LevelSession;
  /** Static solids, for mechanics that need collisions (icicles, boulders). */
  solids: Phaser.Physics.Arcade.StaticGroup;
  /** Enemy/hazard contact: knockback and a heart (respecting invulnerability and shields). */
  hurtPlayer: (sourceX: number) => void;
  /** Pit-like hazard (lava): forced heart loss and respawn at the last checkpoint. */
  fatal: () => void;
  floatText: (x: number, y: number, text: string, color?: string) => void;
  sound: (id: SoundId) => void;
}

/** A self-contained level mechanic created from level data. */
export interface LevelFeature {
  update(clockMs: number, deltaMs: number): void;
  /** Light sources for dark levels. */
  lights?(): LightSource[];
  /** Horizontal push on the player this frame (px/s), e.g. wind. */
  playerPush?(): number;
}
