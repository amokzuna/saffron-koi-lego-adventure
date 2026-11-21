/**
 * Decides whether a player-enemy contact is a stomp (player lands on top) rather than a hit.
 * Uses the player's feet position from the previous physics step so fast falls still register.
 */
export function isStomp(params: {
  playerPreviousBottom: number;
  playerVelocityY: number;
  enemyTop: number;
  tolerancePx: number;
}): boolean {
  return params.playerVelocityY > 0 && params.playerPreviousBottom <= params.enemyTop + params.tolerancePx;
}

/** Direction (-1 or 1) to push the player away from a damage source. */
export function knockbackDirection(playerX: number, sourceX: number): -1 | 1 {
  return playerX < sourceX ? -1 : 1;
}

/**
 * Next patrol direction for an enemy moving between minX and maxX (world px).
 * Reverses when reaching a bound or when blocked in the current direction.
 */
export function nextPatrolDirection(params: {
  x: number;
  direction: -1 | 1;
  minX: number;
  maxX: number;
  blockedLeft: boolean;
  blockedRight: boolean;
}): -1 | 1 {
  const { x, direction, minX, maxX, blockedLeft, blockedRight } = params;
  if (direction === 1 && (x >= maxX || blockedRight)) return -1;
  if (direction === -1 && (x <= minX || blockedLeft)) return 1;
  return direction;
}
