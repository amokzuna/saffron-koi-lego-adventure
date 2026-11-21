# Gameplay Systems (Milestone 2)

Rules for health, damage, hazards, enemies, checkpoints, power-ups, and level results. Tuning values live in
`src/game/config/gameplay.ts` (health/enemies) and `src/game/systems/powerUps.ts` (power-ups); the logic is
covered by unit tests in `src/game/systems/*.test.ts`.

## Health and damage
- The player has **3 hearts**.
- Enemy contact (not a stomp) and spikes cost **1 heart**, followed by **1.2 s of invulnerability**
  (the hero blinks) and a short knockback that removes horizontal control for 0.25 s.
- **Pits** always cost 1 heart, even while invulnerable or shielded, then respawn the player at the
  last activated checkpoint (or the level spawn).
- At 0 hearts the level enters **game over**: physics freezes and the completion timer stops.

## Game over
Options: **Continue from Checkpoint** (or "from Start" if no checkpoint was reached), **Restart Level**,
or **Main Menu**.
Continuing restores full hearts, keeps collected coins/bricks and defeated enemies, keeps the timer value,
and counts toward "hearts lost". Restarting resets everything.

## Hazards
- `spikes`: a run of spike tiles sitting on ground. The hitbox covers the lower part of the tile and is inset
  4 px at each end, so grazing a tip is forgiven. The validator rejects spikes without ground beneath them.
- Lava/water will reuse the same hazard path with different visuals in later worlds.

## Enemies
| Kind | Name | Behavior |
|---|---|---|
| `walker` | Brick Beetle | Walks on ground at 70 px/s, turns at its patrol bounds or walls. |
| `flyer` | Buzz Brick | Flies at 90 px/s between patrol bounds, bobbing ±18 px, ignores terrain. |

| `hopper` | Spore Hopper | Rests 1.5 s on the ground, then hops (520 px/s up, 100 px/s sideways) along its patrol range. Neighbouring hoppers are offset so they don't hop in sync. |

A contact counts as a **stomp** when the player is falling and their feet were at most 10 px below the
enemy's top on the previous physics step. Stomps defeat the enemy and bounce the player (higher if jump is
held). Any other contact hurts the player.

## World 2 hazards
- **Crumbling planks** (`crumbling`): standing on top (not bumping from the side or below) starts a 0.45 s shake,
  then the plank falls. It respawns after 3 s, but waits while anything occupies its space. Cracks make the
  planks readable without relying on color.
- **Spiked balls** (`movingHazards`): follow the same eased ping-pong paths as moving platforms. The hitbox is
  a circle smaller than the art.
- **Darkness** (`darkness`): see LEVEL_DESIGN.md › Dark Cave fairness rules.

## Worlds 3–5 mechanics
All timing is on the game clock (freezes when paused). Pure logic is in `src/game/systems/environment.ts`
(unit-tested); each mechanic's Phaser code is a separate module in `src/game/features/`.

| Mechanic | Rules |
|---|---|
| Sinking sand | Sinks 45 px/s while stood on, up to `maxDrop` tiles; rises 30 px/s when free. Chevron texture. |
| Switches and doors | Touching a switch presses it (stays pressed for the attempt) and opens every linked door. |
| Secret walls | Look like wall fill but are not solid; they fade while the player is inside. |
| Wind | Each cycle: calm → warning (sand streaks, at least 500 ms; levels use 1 s) → gust (`force` px/s added to the player's own velocity). Holding against the wind resists it. |
| Ice | Ground acceleration ×0.25, deceleration ×0.12, top speed ×1.15. Jumping is unchanged. |
| Boost pads | Launch at 460 px/s and keep a raised speed cap for 0.9 s. |
| Icicles | Shake 0.6 s when the player passes within 56 px beneath, fall, shatter, and regrow after 3 s. |
| Lava | Like a pit: forced heart loss and respawn at the last checkpoint. |
| Flame jets | off → warning (smoke, at least 400 ms) → on (column hitbox narrower than the art). |
| Timed platforms | Solid for `visibleMs` of each period and blink for the last 0.7 s; the validator requires visibleMs > 900. |

## Checkpoints
Touching a checkpoint flag raises it (gray → yellow) and shows "CHECKPOINT". The respawn point only moves
forward: touching an earlier flag never moves it back.

## Power-ups
| Power-up | Type | Effect | Duration |
|---|---|---|---|
| Super Jump | timed | Jump velocity ×1.25 (about 55% higher) | 10 s |
| Speed Boost | timed | Max run speed and acceleration ×1.4 | 8 s |
| Shield | timed | Blocks the next enemy/spike hit, then ends. Does not block pits. | 12 s |
| Extra Heart | instant | Restores 1 heart, up to the max of 3 ("HEARTS FULL" if already full) | — |

Balancing rules:
- Collecting a timed power-up that is already active **refreshes** its duration (no stacking).
- Different power-ups can be active together; their multipliers multiply.
- Power-ups are cleared on game over.
- Feedback: pickup text, HUD chip with seconds left and a progress bar, shield bubble that flickers in its
  final 2 seconds.
- Not every level gets every power-up. **Fire Projectile** (needs combat) and **Coin Magnet** are deferred to
  later milestones; the framework supports adding them as new `POWER_UPS` entries.

## Level results and star rating
Each level has a `parTimeMs`. Stars (one per criterion, all shown with ✓/✗ on the results screen):
1. Reach the goal.
2. Find every build brick in the level.
3. Finish within the par time.

The results screen also shows time, coins, bricks, and hearts lost, plus progress messages
(first-clear unlocks, new best stars/time, world complete).

## Progression and saving (Milestone 4)
- Level 1 is always unlocked; completing a level unlocks the next one in campaign order. Completed levels can be
  replayed. Unlocks are **derived** from completed levels plus the campaign order, not stored.
- Saved per level (`localStorage` key `lego-adventure:progress`, `version: 1`): best stars, best time, most coins,
  and most bricks. Each is kept independently, so a fast run and a thorough run both count.
- `parseProgress` drops invalid level records, treats corrupt JSON and unknown or newer versions as empty
  progress, and has a migration table for future schema versions.
- If saving fails, the results screen says progress is kept only for this session.
- Main menu: **Play/Continue** opens the next unlocked, uncompleted level; **Level Select** opens the map.
- `?level=<id>` (developer use) opens any registered level directly, bypassing unlocks.

## Moving platforms
Defined by start tile, offset (`dx`, `dy`), width, and period. They ping-pong with cosine easing (slow at the
ends, which are the boarding moments) on the game clock, so they freeze when paused. They are immovable Arcade
bodies driven by velocity, so riders are carried horizontally and lifted vertically. Yellow bricks distinguish
them from static red platforms.

## Developer sandbox level
`?level=sandbox` loads a short, flat level with one of each system. It is used by the Playwright smoke tests:
walking right meets a checkpoint, spikes, a walker, an extra heart, a brick, and the goal; walking left from
spawn drops into a pit. Unknown `level` values fall back to the default level.
