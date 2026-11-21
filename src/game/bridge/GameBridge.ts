import { TypedEmitter } from '../events/TypedEmitter';
import type { SoundId } from '../../features/audio/sounds';
import type { CollectibleCounts } from '../systems/CollectibleTracker';
import type { ActivePowerUp } from '../systems/powerUps';
import type { LevelRating } from '../systems/rating';

export interface BossHud {
  name: string;
  hp: number;
  maxHp: number;
}

export interface HudState {
  levelName: string;
  collected: CollectibleCounts;
  totals: CollectibleCounts;
  elapsedMs: number;
  falls: number;
  hearts: number;
  maxHearts: number;
  powerUps: ActivePowerUp[];
  /** Present only while a boss fight is in progress. */
  boss: BossHud | null;
}

export interface LevelResult {
  levelId: string;
  levelName: string;
  elapsedMs: number;
  collected: CollectibleCounts;
  totals: CollectibleCounts;
  falls: number;
  heartsLost: number;
  gameOvers: number;
  rating: LevelRating;
}

export interface GameOverInfo {
  /** True when the player will continue from a checkpoint rather than the level start. */
  hasCheckpoint: boolean;
}

/** Events Phaser sends to React. */
export interface GameToUiEvents extends Record<string, unknown> {
  ready: void;
  hud: HudState;
  levelComplete: LevelResult;
  gameOver: GameOverInfo;
  /** A gameplay sound to play (React owns audio playback). */
  sound: SoundId;
}

/** Commands React sends to Phaser. */
export interface UiToGameCommands extends Record<string, unknown> {
  pause: void;
  resume: void;
  restart: void;
  continueFromCheckpoint: void;
  setReducedMotion: boolean;
}

/**
 * The only coupling point between React UI and Phaser gameplay.
 * React never touches scene internals; scenes never import React.
 */
export class GameBridge {
  readonly events = new TypedEmitter<GameToUiEvents>();
  readonly commands = new TypedEmitter<UiToGameCommands>();

  dispose(): void {
    this.events.clear();
    this.commands.clear();
  }
}
