# Technical Architecture

## 1. Recommended stack
- React + TypeScript: application shell, menus, upload flow, settings, level map, overlays
- Phaser 3: gameplay canvas, physics, entities, camera, tilemaps, animation
- Vite: development server and bundling
- Vitest: unit tests
- Playwright: browser smoke and interaction tests

Confirm the repository's existing stack before making changes.

## 2. Architectural boundaries
React owns:
- Main menu and navigation
- Character upload and preview
- World/level selection
- Settings and accessibility UI
- Pause, game-over, and level-complete overlays
- Save/progress UI

Phaser owns:
- Player movement and physics
- World collision and hazards
- Enemies and boss behavior
- Collectibles and power-ups
- Camera and level transitions
- In-game feedback and effects

Use a small, typed bridge for React-to-Phaser commands and Phaser-to-React events. Avoid direct coupling between arbitrary React components and Phaser scene internals.

## 3. Suggested structure
```text
src/
  app/
    App.tsx
    routes/
    components/
  game/
    config/
    scenes/
    entities/
    systems/
    levels/
    events/
    bridge/
  features/
    character/
    progression/
    settings/
  data/
    worlds/
    levels/
  assets/
    images/
    audio/
    tilesets/
  storage/
  styles/
  test/
```

## 4. Game scenes
Suggested scenes:
- BootScene: initialize configuration and preload minimal assets
- PreloadScene: load shared assets and show loading progress
- MainMenuScene: optional Phaser-based title scene; React may own the menu instead
- LevelScene: run a level from data/configuration
- UIScene: only if in-game HUD is rendered inside Phaser

Prefer React for application UI and Phaser for gameplay. Avoid duplicating the same HUD in both.

## 5. Level data
Represent levels as data, not hand-written scene code. Each level should define:
- Stable level ID and display name
- World ID
- Tilemap or layout reference
- Player spawn
- Exit/goal
- Checkpoints
- Collectibles
- Enemies
- Hazards
- Power-up placements
- Optional boss configuration
- Completion conditions

Use validated TypeScript types and keep asset references explicit.

## 6. Physics and controls
- Use Phaser Arcade Physics unless a concrete requirement needs another physics system.
- Keep movement parameters in a central configuration object.
- Support keyboard and touch input through a shared input abstraction.
- Prevent the page from scrolling while the player is using gameplay touch controls.
- Handle focus loss and tab visibility changes safely; pause or mute as appropriate.

## 7. Persistence
First version:
- Use localStorage for settings, selected hero metadata, unlocked levels, and level results.
- Store uploaded image data carefully; large images may exceed localStorage limits. Prefer IndexedDB for local image blobs.
- Version the save schema and handle invalid or old save data gracefully.

Later:
- Add a backend only when accounts or cross-device sync are required.
- Keep user-uploaded images private by default and define retention/deletion behavior.

## 8. Performance
- Use sprite atlases and appropriately sized images.
- Avoid unnecessary per-frame allocations.
- Reuse objects for frequently spawned effects if profiling shows a need.
- Load assets per world or level where practical.
- Test on a representative low/mid-range mobile device.
- Provide loading feedback and graceful asset error handling.

## 9. Testing
- Unit test movement/configuration helpers and progression logic.
- Test save/load and save-schema migration.
- Browser smoke test: launch, start level, move, jump, collect item, pause, restart, finish.
- Check responsive layouts and touch input at mobile viewport sizes.

## 10. Implementation notes (Milestone 1)
Actual stack: React 19, Phaser 3.90 (Arcade Physics), TypeScript 5 (strict, `noUncheckedIndexedAccess`), Vite 8, Vitest 4, Playwright. (Vitest 5 requires Node 22.12+; Vitest 4 keeps Node 20 support.)

### Layout
```text
src/
  app/                 React shell: App (screen state), screens/, components/, hooks/
  game/
    bridge/GameBridge  Typed React<->Phaser contract (events: ready, hud, levelComplete, gameOver; commands: pause, resume, restart, continueFromCheckpoint)
    config/            Constants, movement tuning (MOVEMENT), texture keys
    entities/Player    Arcade sprite; delegates feel to systems/movement; knockback/bounce
    entities/Enemy     Enemy base + WalkerEnemy/FlyerEnemy, created from EnemyPlacement data
    entities/bosses/   BossBase + Guardian/Protector/Sentinel/Frost/Final bosses, each wrapping a pure brain; createBoss()
    features/          One module per environmental mechanic (SinkingSand, SwitchesAndDoors, Wind, IceFeatures,
                       FireFeatures) implementing LevelFeature against a small FeatureContext
    entities/          MovingPlatform, MovingHazard (spiked ball), CrumblePlank, Enemy (walker/flyer/hopper)
    config/themes.ts   Per-theme palettes; themed texture keys (`<base>:<theme>`)
    levels/reachability Level lint: simulates player movement to prove goals and collectibles are reachable
    input/             VirtualControls (touch state) + InputCombiner (merges sources, jump edge detection)
    levels/            LevelDefinition types, validateLevel, buildLevel (data -> Phaser objects)
    scenes/            BootScene (generates textures), LevelScene (runs a LevelDefinition)
    systems/           Pure logic: movement, LevelSession (per-run state), HealthSystem, CheckpointTracker,
                       PowerUpSystem, combat (stomp/patrol), rating, CollectibleTracker; plus textures/effects
  data/campaign.ts     Worlds and campaign order (unlock order, next level, level numbers)
  data/levels/         Level registry (index.ts), helpers.ts, world1/level1-4.ts, dev levels (testLevel, sandboxLevel)
  features/progression/ progress.ts (pure unlock/best-result rules, versioned parsing), ProgressContext
  features/character/  Hero types, validation, crop, stylize, heroRenderer (shared by React preview + Phaser), HeroContext
  storage/             imageStore (IndexedDB, images stored as bytes + MIME type), heroStorage, progressStorage,
                       settingsStorage, clearAll (delete all saved data)
  features/audio/      sounds.ts (generated SFX and music data), AudioEngine (Web Audio playback)
  features/settings/   settings.ts (versioned model), SettingsContext (applies volumes and reduced motion)
e2e/                   Playwright smoke tests
```

### Decisions and trade-offs
- **Screen navigation** is plain React state in `App.tsx`; no router until there are enough screens to justify one.
- **Phaser lifecycle**: `PhaserCanvas` creates a new `Phaser.Game` and a new `GameBridge` per mount and destroys both on unmount, so StrictMode double-mounting and leaving the level never leak listeners.
- **Pause** is owned by React (Esc/P, HUD button, tab hidden, window blur, portrait rotate hint) and sent to Phaser as a command; `LevelScene` pauses the scene (and its physics) and releases keyboard capture so Space/arrow keys can operate the menu.
- **Restart** calls `scene.restart()`; all per-run state is reset in `create()`.
- **Art** is generated at runtime with Phaser Graphics (no image files). This keeps the slice original and dependency-free; it will be replaced by atlases when real art exists.
- **Level data** is authored in tile units (32 px). Each solid block becomes a single static body (a `Zone`) with tiled visuals, so collision cost doesn't scale with block area.
- **Movement feel** (acceleration, coyote time, jump buffer, variable jump height) lives in pure functions with unit tests; tuning is in `config/movement.ts`.
- **LevelSession** (Milestone 2) holds all per-attempt state (hearts, timers, pickups, checkpoints, power-ups) with no Phaser dependency. `LevelScene` only translates physics events into session calls and renders the outcome, so gameplay rules are unit-tested without a browser.
- **Game clock**: invulnerability and power-up timers run on the session clock, which advances only in `update()`, so pausing freezes them automatically.
- **Enemies** live in a plain (non-physics) Group so each enemy keeps its own body settings (Arcade physics groups reset body defaults on add) and destroyed enemies drop out automatically.
- **Pits** cost a heart and respawn at the latest checkpoint; see `docs/GAMEPLAY_SYSTEMS.md` for all rules.
- **Hero** (Milestone 3): `HeroProvider` loads the saved hero at startup (Play is disabled until it's ready). `GameScreen` snapshots the appearance at mount and passes it to `BootScene`, which builds hero textures with `heroRenderer` — the only path from React state into Phaser art. Hero textures are rendered at 2x and the player sprite is scaled by 1/2; Arcade body sizes/offsets are specified in texture pixels.
- **Navigation** (Milestone 4): `App` holds a typed `Route` union (menu, map, heroSetup, howToPlay, credits, game). Game routes are keyed by level and attempt so "Next Level" mounts a fresh Phaser instance. `?level=<id>` opens a level directly for development and e2e.
- **Themes and darkness** (Milestone 5): every theme's tiles and backgrounds are generated at boot. Dark levels use a screen-space RenderTexture redrawn each frame, with soft light brushes erased at the player, glow mushrooms, signs, checkpoints, hazards, enemies, and the goal.
- **Level features** (Milestone 5): mechanics added for Worlds 3–5 are self-contained `LevelFeature` modules created only when a level uses them. They get a `FeatureContext` (player, session, solids, hurt/fatal callbacks) instead of touching `LevelScene` internals; wind contributes a per-frame player push, and features can add lights in dark levels.
- **Bosses** are subclasses of `BossBase`; each wraps a pure brain and returns semantic tick results (`vulnerable`, `defeated`, shockwave spawns), so `LevelScene` handles every boss the same way.
- **Audio** (Milestone 6): `LevelScene` emits `sound` events on the bridge; `GameScreen` plays them through the shared `AudioEngine` and runs the world's music loop (lowered while paused, stopped on completion). The AudioContext is created on the first user gesture. No audio files exist; everything is synthesized from note data.
- **Reduced motion:** camera shake and flash go through `systems/fx.ts`, which checks a `reducedMotion` flag in the Phaser registry. React sets it at game creation and updates it through the `setReducedMotion` bridge command. CSS transitions are disabled via a `reduce-motion` class on `<html>`.
- **Effects:** small particle bursts (`fx.burst`) for pickups, stomps, hard landings, boulders, and level completion.
- **PWA** (installable app): `src/pwa/` (install mode logic, service worker registration, full screen and orientation lock), `pwa/service-worker.js` (template, emitted as `dist/sw.js` by a small Vite plugin with the build's precache list), `public/manifest.webmanifest`, `public/icons/`. See `docs/DEPLOYMENT.md`.
- **Progression** is recorded by `GameScreen` when the bridge reports `levelComplete`; only campaign levels are recorded.
- **Touch**: on-screen buttons use pointer events with pointer capture; the game screen sets `touch-action: none`. Touch controls show on coarse-pointer devices or after the first touch.
- **Scaling**: 960x540 internal resolution with `Scale.FIT`; wider/taller screens get letterboxing. In portrait on touch devices a rotate hint pauses the game, with an option to play in portrait anyway.
- **No persistence yet**: nothing is saved in Milestone 1, so no save UI is shown.
