# Development Roadmap

## Milestone 0 — Repository discovery ✅ (done: blank repo; stack recorded in TECHNICAL_ARCHITECTURE.md §10)
- Inspect existing files, scripts, dependencies, and conventions.
- Confirm whether this is a blank project or an existing app.
- Record the actual stack and proposed changes.

Exit criteria: app can be installed and run using documented commands.

## Milestone 1 — Playable vertical slice ✅ (done)
- App shell and main menu
- Phaser canvas and one small test level
- Player movement, jump, gravity, collision, camera follow
- Collectible and level exit
- Keyboard and basic touch controls
- Pause and restart
- Placeholder hero art

Exit criteria: a player can start, play, collect an item, reach the exit, pause, and restart on desktop and mobile viewport sizes.

## Milestone 2 — Core gameplay systems ✅ (done; rules in GAMEPLAY_SYSTEMS.md. Fire Projectile and Coin Magnet deferred)
- Health and damage
- Enemies and hazards
- Checkpoints and respawn
- Power-up framework
- Level completion results

Exit criteria: systems are reusable and covered by tests where practical.

## Milestone 3 — Custom hero workflow ✅ (done: local in-browser stylization; see CHARACTER_PIPELINE.md)
- Upload and validate image
- Preview/crop
- Save selected hero locally
- Define actual stylization strategy
- Integrate generated/static sprite assets only after visual consistency is verified

Exit criteria: user can select a custom hero and see it in gameplay; unsupported animation promises are not shown.

## Milestone 4 — Level data and world map ✅ (done: World 1 playable end-to-end; see LEVEL_DESIGN.md › Implementation status)
- Data-driven level format
- World and level selection UI
- Unlock progression
- Build and test levels 1–4

Exit criteria: first world is playable end-to-end.

## Milestone 5 — Complete 20-level campaign ✅ (done: all 20 levels and five bosses, built one world at a time; see LEVEL_DESIGN.md)
- Build levels 5–20
- Five distinct world themes
- Four boss/finale encounters
- Balance difficulty and checkpoint placement

Exit criteria: all 20 levels can be completed and replayed.

## Milestone 6 — Polish and release readiness ✅ (done; see ACCEPTANCE_CRITERIA.md › Verification notes and DEPLOYMENT.md)
- Audio and settings
- Animations and visual effects
- Accessibility and responsive polish
- Save migration and recovery
- Performance testing
- Browser/device testing
- Production build and deployment documentation

Exit criteria: acceptance criteria pass and known limitations are documented.

## Working approach
Complete one milestone at a time. Do not create 20 placeholder levels and call the game complete. Keep a playable build throughout development.
