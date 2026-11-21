/** Size of one level grid tile in world pixels. Level data is authored in tile units. */
export const TILE_SIZE = 32;

/** Internal game resolution. The canvas is scaled to fit while keeping this 16:9 aspect ratio. */
export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

/** How far below the level bottom the player may fall before respawning. */
export const FALL_RESPAWN_MARGIN = 96;

/** Minimum interval between timer-only HUD updates sent to React. */
export const HUD_TIMER_INTERVAL_MS = 200;

/** Player collision box in world pixels (shared by the Player entity and level analysis). */
export const PLAYER_BODY_WIDTH = 20;
export const PLAYER_BODY_HEIGHT = 46;
