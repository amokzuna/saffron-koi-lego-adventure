/** Central tuning for health, damage, and enemies. Times in ms, velocities in px/s. */
export const GAMEPLAY = {
  maxHearts: 3,
  /** Invulnerability after taking damage or respawning. */
  invulnerabilityMs: 1200,
  /** Horizontal input is ignored for this long after knockback so the hit is felt. */
  knockbackControlLockMs: 250,
  knockbackVelocityX: 240,
  knockbackVelocityY: 380,
  /** Upward velocity after stomping an enemy; holding jump bounces higher. */
  stompBounceVelocity: 420,
  stompBounceHeldVelocity: 600,
  /** How far below the enemy's top edge the player's feet may have been last step and still count as a stomp. */
  stompTolerancePx: 10,
  walkerSpeed: 70,
  flyerSpeed: 90,
  flyerBobAmplitudePx: 18,
  flyerBobPeriodMs: 1600,
  hopperRestMs: 1500,
  hopperSpeedX: 100,
  hopperJumpVelocity: 520,
} as const;
