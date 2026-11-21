# LEGO Adventure

An original 2D platform-adventure game for desktop web and mobile browsers. Players explore 20 levels across five themed worlds and can create a custom minifigure-inspired hero from an uploaded image.

## Current status
**All six roadmap milestones are complete:** 20 levels across five worlds, five bosses, an ending, a custom photo hero, saved progress, generated music and sound, settings, and accessibility options. The app has a main menu and a Phaser canvas running a test level ("Brick Meadow") with platforms, pits, spikes, two enemy types, checkpoints, power-ups, coins, build bricks, and a goal. Players have three hearts, can stomp enemies, continue from checkpoints after game over, and get a 3-star rating with visible criteria on completion. Keyboard and touch controls, pause/restart, and responsive layouts work on desktop and mobile. Players can customize their hero: upload a face photo (processed and stored only on their device), crop it, pick a face style, outfit colors, and a name; the hero persists across reloads and appears in gameplay. Progress (unlocks, best stars and times) is saved locally and shown on the level map. See `docs/DEPLOYMENT.md` before publishing (see `docs/ROADMAP.md`). Gameplay rules are documented in `docs/GAMEPLAY_SYSTEMS.md`.

## Getting started
Requires Node.js 20.19+ (or 22.12+).

```bash
npm install
npm run dev            # start the dev server (http://localhost:5173); add ?level=<id> (e.g. sandbox, w1-4) to open a level directly
npm run build          # type-check and build for production into dist/
npm run preview        # serve the production build
npm run typecheck      # TypeScript only
npm test               # Vitest unit tests
npx playwright install chromium   # one-time browser download for e2e
npm run test:e2e       # Playwright e2e tests (Chromium desktop + Android landscape; includes portrait checks)
npm run test:e2e:cross # optional: WebKit/Safari, iPhone, Firefox (npx playwright install webkit firefox)
npm run check          # typecheck + unit tests + production build
```

## Controls
| Action | Keyboard | Touch |
|---|---|---|
| Move | ← → or A D | ◀ ▶ (bottom left) |
| Jump (hold for higher) | Space, ↑ or W | Jump (bottom right) |
| Pause / resume | Esc (P also pauses) | Pause button (top right) |

## Product scope
- 20 levels, grouped into five worlds with four levels each
- Side-scrolling platform gameplay
- Player movement, jumping, enemies, hazards, collectibles, checkpoints, power-ups, and boss encounters
- Character image upload and custom hero preview
- Desktop keyboard and mobile touch controls
- Progress saving and level unlocks

## Recommended stack
TypeScript, Phaser 3, React, and Vite. See `docs/TECHNICAL_ARCHITECTURE.md`.

## Start with Claude
1. Open this folder as the project in Claude Code.
2. Ask Claude to inspect the repository and follow `CLAUDE.md`.
3. Begin with the first milestone in `docs/ROADMAP.md`.
4. Keep the game runnable after each milestone.

## Documentation
- `CLAUDE.md` — instructions and development conventions for Claude
- `docs/PRODUCT_REQUIREMENTS.md` — product and gameplay requirements
- `docs/TECHNICAL_ARCHITECTURE.md` — suggested code architecture
- `docs/LEVEL_DESIGN.md` — 20-level world plan
- `docs/GAMEPLAY_SYSTEMS.md` — health, enemies, hazards, checkpoints, power-ups, and rating rules
- `docs/DEPLOYMENT.md` — static hosting, caching, release checklist
- `docs/CHARACTER_PIPELINE.md` — uploaded-image and character workflow
- `docs/UI_UX.md` — screens, controls, and responsive behavior
- `docs/ROADMAP.md` — implementation milestones
- `docs/ACCEPTANCE_CRITERIA.md` — testable completion criteria
