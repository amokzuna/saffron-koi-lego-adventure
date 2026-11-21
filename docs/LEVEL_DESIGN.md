# Level Design Plan

## World structure
Five worlds with four levels each. The fourth level of each world is a boss or major finale.

| World | Theme | Levels |
|---|---|---|
| 1 | Green Grassland | 1–4 |
| 2 | Mushroom Forest | 5–8 |
| 3 | Desert Kingdom | 9–12 |
| 4 | Frozen Kingdom | 13–16 |
| 5 | Lava Volcano | 17–20 |

## Level list

### World 1 — Green Grassland
1. Welcome Adventure — teach movement, jumping, and basic collectibles.
2. Mushroom Valley — introduce simple enemies and raised platforms.
3. Moving Platforms — introduce moving platforms, pits, and timing.
4. Grassland Guardian — first boss; combine previously learned mechanics.

### World 2 — Mushroom Forest
5. Hidden Forest — introduce denser terrain and new enemy patterns.
6. Jungle Bridges — narrow bridges, gaps, and moving hazards.
7. The Dark Cave — visibility and navigation challenge; preserve fair readability.
8. Forest Protector — boss with clear attack tells and safe windows.

### World 3 — Desert Kingdom
9. Sandy Adventure — introduce sinking or shifting sand platforms if readable.
10. Ancient Pyramid — interior routes, switches, and hidden rooms.
11. Desert Storm — wind or moving environmental hazards.
12. Pyramid Sentinel — boss arena with multiple attack phases.

### World 4 — Frozen Kingdom
13. Snowy Mountains — introduce slippery surfaces carefully.
14. Ice Slides — momentum and slope-based challenges.
15. Frozen Castle — combine moving platforms, hazards, and enemy placement.
16. Frost Guardian — boss with telegraphed area attacks.

### World 5 — Lava Volcano
17. Fire Valley — introduce lava pools and heat-themed hazards.
18. Lava Bridges — timed platforms and precision jumps.
19. Volcano Challenge — final non-boss skill test, combining all major mechanics.
20. Final Guardian — final boss and game completion sequence.

## Difficulty curve
- Levels 1–3: teach one mechanic at a time.
- Level 4: test World 1 skills with a forgiving boss.
- Levels 5–8: combine mechanics and add enemy variety.
- Levels 9–12: increase navigation and timing complexity.
- Levels 13–16: add movement-surface challenges.
- Levels 17–20: combine mechanics, with checkpoints before demanding sections.

## Design rules
- Every new mechanic should be introduced safely before it becomes dangerous.
- Use visual cues and predictable timing for hazards.
- Place checkpoints before long or difficult sequences.
- Avoid unavoidable damage and blind jumps.
- Ensure each level has a clear start, readable route, and visible goal.
- Tune difficulty through playtesting rather than only increasing enemy health or hazard count.
- Boss attacks need readable telegraphs, recovery windows, and consistent rules.

## Implementation status
World 1 (levels 1–4) is built in `src/data/levels/world1/` and registered in `src/data/campaign.ts`.

| # | Level | Teaches / tests | New systems |
|---|---|---|---|
| 1 | Welcome Adventure | Running, jumping 3-tile gaps, a low wall, collecting; tutorial signs | Decorations and signs |
| 2 | Mushroom Valley | First walker on open flat ground, raised plateaus, one flyer at the end; Super Jump and Extra Heart | — |
| 3 | Moving Platforms | Ground-level ferry, wider ferry, vertical lift, high transfer; checkpoint before each section | Moving platforms |
| 4 | Grassland Guardian | Short warm-up, checkpoint and heart, then the boss arena | Boss arena and Guardian |

### Automated level checks
`src/data/campaign.test.ts` runs for every campaign level:
- `validateLevel`: structure, bounds, ids, support under entities, patrol ranges, boss arena rules.
- `analyzeReachability` (`src/game/levels/reachability.ts`): simulates the real movement config (gravity,
  jump velocity, acceleration, player box) from every standing surface. It requires the goal and **every coin and
  brick** to be reachable without power-ups. Moving platforms are sampled along their path (timing is assumed
  waitable). Enemies and hazards are ignored. This check caught an unreachable brick platform in Level 2 during
  development.
- Each level must have exactly three bricks and at least one checkpoint.

### Boss: Grassland Guardian
State machine in `src/game/systems/BossBrain.ts` (unit-tested):
walk toward the player (2.2 / 1.8 / 1.4 s by phase) → **telegraph** (0.9 s: stops, flashes red, "!" icon; the
charge direction is locked here) → **charge** (260 / 300 / 340 px/s) → hits an arena wall → **stunned**
(2.2 s, harmless, X-eyes) → walk.
- Only a stomp while stunned deals damage (3 hits). Stomping at other times bounces the player off safely.
- Touching it while stunned or hurt does not hurt the player.
- Crossing the trigger closes a gate and locks the camera to the arena. Game over → Continue restarts the
  encounter from the pre-arena checkpoint.
- The goal flag drops in after defeat.
- Arena platforms (one row lower than a full jump) let the player get out of the charge lane.

Verification: unit tests cover every transition. During development an exploratory Playwright bot (using a
temporary debug hook, since removed) defeated the boss with no game overs in about 55 s, reached the revealed
goal, and completed the level. The committed e2e test covers the arena trigger and boss health bar.

World 2 (levels 5–8) is built in `src/data/levels/world2/`:

| # | Level | Teaches / tests | New systems |
|---|---|---|---|
| 5 | Hidden Forest | Stepped plateaus, upper route, Spore Hoppers (first one on flat ground), mixed enemies | Forest theme, hopper enemy |
| 6 | Jungle Bridges | Long wooden bridges, crumbling plank runs and stepping stones, spiked balls (vertical and horizontal) | Bridges, crumbling planks, moving hazards |
| 7 | The Dark Cave | Navigating in low light: low passages, a lift to a high ledge, spikes marked by glow mushrooms | Cave theme, darkness overlay |
| 8 | Forest Protector | Warm-up with a hopper, then a flat arena | Protector boss and shockwaves |

**Dark Cave fairness rules:** a 190 px player light; glow mushrooms along the route and before every hazard;
checkpoints, signs, spikes, and the goal are always lit; enemies and spiked balls carry a faint glow. No hazard
sits under a low ceiling. The validator rejects darkness above 0.95 opacity or a player light under 120 px.

### Boss: Forest Protector
State machine in `src/game/systems/ProtectorBrain.ts` (unit-tested):
idle, facing the player (1.6 / 1.3 / 1.1 s by phase) → **telegraph** (1.0 s: crouches, glows orange, "!" icon, and a
pulsing red target ellipse marks the landing spot, locked at the player's position and kept 48 px from the walls)
→ **leap** (1.0 s ballistic arc) → **land**: two ground shockwaves travel outward (200 / 240 / 280 px/s; jump
them) → **stuck** (2.4 s: roots caught, X-eyes, harmless) → idle. The final phase chains two leaps before
getting stuck. Only a stomp while stuck deals damage (3 hits).

Verification: an exploratory bot (temporary debug hook, since removed) defeated it. Damage it took in the
arena came from the bot walking into the boss; most of its game overs came from random hopping into the
warm-up pit. The committed e2e test covers the arena trigger and health bar.

Both bosses share `entities/bosses/BossBase.ts` (arena bounds, warning icon, reset and defeat sequences).

World 3 (levels 9–12), World 4 (13–16), and World 5 (17–20) are built in `src/data/levels/world3–5/`:

| # | Level | Teaches / tests | New systems |
|---|---|---|---|
| 9 | Sandy Adventure | Sinking sand: first one over solid ground, then over pits | Desert theme, sinking platforms |
| 10 | Ancient Pyramid | Interior routes; switch on a ledge opens door 1; door 2's switch is on the upper floor; a false wall hides a brick | Pyramid theme, switches, doors, secret walls |
| 11 | Desert Storm | Gusts (headwind on flat ground first), then over a ferry and sinking sand | Wind zones |
| 12 | Pyramid Sentinel | Boss: boulders on red markers, slam, stunned | Sentinel boss, boulders |
| 13 | Snowy Mountains | Ice: first stretch ends on normal ground, later ones at gaps and on small platforms | Snow theme, ice surfaces |
| 14 | Ice Slides | Momentum: boost pads and long ice runs, spikes after landings | Boost pads |
| 15 | Frozen Castle | Combines ferries, crumbling planks, a spiked ball, ice, enemies, icicles (introduced on safe ground) | Castle theme, icicles |
| 16 | Frost Guardian | Boss: alternating frost-marked floor sections erupt; it kneels when exhausted | Frost boss, eruptions |
| 17 | Fire Valley | Lava pools with stepping stones; flame jets that puff smoke before firing | Volcano theme, lava, flame jets |
| 18 | Lava Bridges | Timed platforms (blink before vanishing) with a rest stop; precise stone hops, one with a flame jet | Timed platforms |
| 19 | Volcano Challenge | Final skill test combining all major mechanics, with a checkpoint before each section | — |
| 20 | Final Guardian | Final boss, then the ending screen | Final boss |

**Deviation:** "Ice Slides" asks for slope-based challenges. Arcade Physics uses axis-aligned boxes, so true slopes
are not supported; momentum comes from ice surfaces and boost pads instead.

### Bosses 3–5
- **Pyramid Sentinel** (`SentinelBrain`): hovers side to side → **drop telegraph** (red ellipse markers on the
  floor, ≥190 px apart, one on the player) → boulders fall exactly on the markers → after 2/2/3 drops: **slam
  telegraph** (moves above the player, flashes) → slams to the ground → **stunned** 2.4 s (stomp) → rises. More
  boulders per drop as it takes damage.
- **Frost Guardian** (`FrostBrain`): walks slowly toward the player → **telegraph** (glowing frost marks on every
  other floor section; 1.2/1.05/0.95 s) → ice spikes erupt there for 0.7 s → the pattern alternates → after 2/3/3
  eruptions it is **exhausted** for 2.8 s (stomp). A safe section is always one section away.
- **Final Guardian** (`FinalPhases`): 4 phases alternating a charge cycle (Guardian rules) and a double-leap cycle
  (Protector rules); one stomp in the vulnerable window ends a phase. Phases 3–4 add boulder rain on red markers
  shown 1.1 s before.

**Verification:** exploratory bots (temporary debug hook, since removed) defeated every boss: Sentinel and Frost
Guardian in about 44 s with one game over each; the Final Guardian in about 71 s with two game overs, both during
the boulder phases. The committed e2e tests cover arena triggers and boss bars for levels 4 and 8, smoke-load
other late levels, and check the ending flow. Every campaign level passes `validateLevel` and `analyzeReachability`.

### Campaign completion
Finishing level 20 replaces "Next Level" with **View Ending**. The ending screen shows the hero, levels completed,
stars, bricks, the total of best times, and credits. Once the campaign is complete, the level map also offers
**View Ending**.
