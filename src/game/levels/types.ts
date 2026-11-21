/**
 * Data-driven level format. All coordinates are in tile units (see TILE_SIZE),
 * with the origin at the top-left of the level and y increasing downward.
 */

export interface TilePoint {
  x: number;
  y: number;
}

/** A solid rectangular block of tiles (ground or floating platform). */
export interface SolidBlock {
  x: number;
  y: number;
  width: number;
  height: number;
  style: 'ground' | 'platform' | 'bridge' | 'ice';
}

export type CollectibleKind = 'coin' | 'brick';

export interface CollectiblePlacement {
  /** Stable ID, unique within the level. Used to ensure each pickup is counted once. */
  id: string;
  kind: CollectibleKind;
  /** Tile the collectible is centered in. */
  x: number;
  y: number;
}

/** Checkpoint flag standing in tile (x, y); its base rests on row y + 1. */
export interface CheckpointPlacement {
  id: string;
  x: number;
  y: number;
}

/** Spikes cost a heart with knockback; lava acts like a pit (heart lost, respawn at checkpoint). */
export type HazardKind = 'spikes' | 'lava';

/** A horizontal run of hazard tiles occupying row y, from x to x + width - 1. */
export interface HazardPlacement {
  id: string;
  kind: HazardKind;
  x: number;
  y: number;
  width: number;
}

export type EnemyKind = 'walker' | 'flyer' | 'hopper';

export interface EnemyPlacement {
  id: string;
  kind: EnemyKind;
  /** Starting tile. Walkers stand on row y + 1; flyers hover centered in row y. */
  x: number;
  y: number;
  /** Horizontal patrol range in tiles (inclusive). */
  patrolMinX: number;
  patrolMaxX: number;
}

export type PowerUpKind = 'superJump' | 'speedBoost' | 'shield' | 'extraHeart';

export interface PowerUpPlacement {
  id: string;
  kind: PowerUpKind;
  x: number;
  y: number;
}

/**
 * A platform that ping-pongs between (x, y) and (x + dx, y + dy) with smooth easing.
 * One full cycle (there and back) takes periodMs; phaseMs offsets where in the cycle it starts.
 */
export interface MovingPlatformPlacement {
  id: string;
  x: number;
  y: number;
  width: number;
  dx: number;
  dy: number;
  periodMs: number;
  phaseMs?: number;
}

export type DecorationKind = 'bush' | 'flower' | 'mushroom' | 'sign' | 'glowMushroom';

/** A run of planks in row y that shake and fall shortly after being stood on, then respawn. */
export interface CrumblingPlacement {
  id: string;
  x: number;
  y: number;
  width: number;
}

export type MovingHazardKind = 'spikeBall';

/** A damaging object that ping-pongs between (x, y) and (x + dx, y + dy) like a moving platform. */
export interface MovingHazardPlacement {
  id: string;
  kind: MovingHazardKind;
  x: number;
  y: number;
  dx: number;
  dy: number;
  periodMs: number;
  phaseMs?: number;
}

/** Dark levels: the screen is covered except around the player and light sources (glow mushrooms, checkpoints, goal). */
export interface DarknessSettings {
  /** Opacity of the darkness overlay, 0–1. */
  ambientAlpha: number;
  /** Radius of the player's light in px. */
  playerLightRadius: number;
}

export type ThemeId = 'grassland' | 'forest' | 'cave' | 'desert' | 'pyramid' | 'snow' | 'castle' | 'volcano';

/** Platform that sinks while stood on (up to maxDrop tiles) and rises back when left. */
export interface SinkingPlatformPlacement {
  id: string;
  x: number;
  y: number;
  width: number;
  maxDrop: number;
}

/** Pressure switch standing in tile (x, y). Touching it permanently opens every door linked to it. */
export interface SwitchPlacement {
  id: string;
  x: number;
  y: number;
}

export interface DoorPlacement {
  id: string;
  switchId: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Looks like solid wall but can be walked through; fades while the player is inside. */
export interface SecretPlacement {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Periodic horizontal gusts over columns x..x+width-1. Each cycle: calm, warning (visible streaks),
 * then a gust of `force` px/s (positive pushes right) for activeMs.
 */
export interface WindZonePlacement {
  id: string;
  x: number;
  width: number;
  force: number;
  periodMs: number;
  activeMs: number;
  warningMs: number;
  phaseMs?: number;
}

/** Ice slide pad: launches the player in `direction` at boost speed. */
export interface BoostPadPlacement {
  id: string;
  x: number;
  y: number;
  width: number;
  direction: -1 | 1;
}

/** Icicle hanging in tile (x, y). Shakes when the player passes beneath, falls, shatters, and regrows. */
export interface IciclePlacement {
  id: string;
  x: number;
  y: number;
}

/** Flame jet rising from tile (x, y) upward `height` tiles; cycles off -> warning (smoke) -> on. */
export interface FlameJetPlacement {
  id: string;
  x: number;
  y: number;
  height: number;
  periodMs: number;
  activeMs: number;
  warningMs: number;
  phaseMs?: number;
}

/** Platform that is solid for visibleMs of each period (blinking before it vanishes). */
export interface TimedPlatformPlacement {
  id: string;
  x: number;
  y: number;
  width: number;
  periodMs: number;
  visibleMs: number;
  phaseMs?: number;
}

/** Non-colliding scenery standing on top of row y + 1. Signs show `text`. */
export interface DecorationPlacement {
  kind: DecorationKind;
  x: number;
  y: number;
  text?: string;
}

export type BossKind = 'guardian' | 'protector' | 'sentinel' | 'frost' | 'final';

/**
 * Boss encounter. Crossing triggerX locks the camera to the arena and closes a gate at arenaMinX.
 * The level goal stays hidden until the boss is defeated and must be inside the arena.
 */
export interface BossPlacement {
  kind: BossKind;
  name: string;
  x: number;
  y: number;
  arenaMinX: number;
  arenaMaxX: number;
  triggerX: number;
}

export interface LevelDefinition {
  id: string;
  name: string;
  worldId: number;
  /** Level size in tiles. */
  width: number;
  height: number;
  /** Tile the player stands in at spawn: feet rest on the top edge of tile row y + 1. */
  spawn: TilePoint;
  /** Tile the goal flag stands in (flag base sits on top of row y + 1). */
  goal: TilePoint;
  /** Target completion time for the time star. */
  parTimeMs: number;
  solids: SolidBlock[];
  collectibles: CollectiblePlacement[];
  checkpoints: CheckpointPlacement[];
  hazards: HazardPlacement[];
  enemies: EnemyPlacement[];
  powerUps: PowerUpPlacement[];
  movingPlatforms: MovingPlatformPlacement[];
  decorations: DecorationPlacement[];
  crumbling?: CrumblingPlacement[];
  movingHazards?: MovingHazardPlacement[];
  darkness?: DarknessSettings;
  sinkingPlatforms?: SinkingPlatformPlacement[];
  switches?: SwitchPlacement[];
  doors?: DoorPlacement[];
  secrets?: SecretPlacement[];
  windZones?: WindZonePlacement[];
  boostPads?: BoostPadPlacement[];
  icicles?: IciclePlacement[];
  flameJets?: FlameJetPlacement[];
  timedPlatforms?: TimedPlatformPlacement[];
  boss?: BossPlacement;
  /** Visual theme (palette, background, ground tiles). */
  theme: ThemeId;
}
