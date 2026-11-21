# Acceptance Criteria

## Application
- [x] App starts using documented commands. (README › Getting started)
- [x] No blocking console errors during the main player journey. (every e2e test asserts no page or console errors)
- [x] Production build completes successfully. (`npm run check`)
- [x] Layout works at desktop and mobile viewport sizes. (desktop, Android landscape, iPhone landscape, portrait e2e)

## Gameplay
- [x] Player can move left and right.
- [x] Player can jump and land reliably on platforms.
- [x] Player collides with world geometry correctly.
- [x] Camera follows the player without exposing unintended empty space. (camera bounds = level, or arena during boss fights)
- [x] Collectibles update the HUD exactly once per pickup. (CollectibleTracker unit tests)
- [x] Player can reach the goal and complete the level. (reachability analysis for all 20 levels; e2e completes Level 1 and the sandbox)
- [x] Pause and restart work.
- [x] Damage, health, checkpoints, and respawn behave consistently when implemented. (LevelSession, HealthSystem, CheckpointTracker unit tests; sandbox e2e)

## Character upload
- [x] Supported image formats are validated. (content sniffing)
- [x] Unsupported or oversized files show a helpful error.
- [x] User can preview and confirm or cancel an upload.
- [x] A default hero remains available.
- [x] Selected hero persists according to the documented storage approach. (localStorage + IndexedDB)
- [x] The app does not claim a still image is a complete animated sprite sheet.

## Progression
- [x] All 20 level definitions exist before campaign completion is claimed.
- [x] Levels unlock according to the documented progression rules.
- [x] Completed levels can be replayed.
- [x] Progress survives a reload.
- [x] Invalid or outdated save data does not crash the app. (versioned parsers for progress, hero, and settings)

## Controls
- [x] Keyboard controls work.
- [x] Touch controls work on mobile browsers. (emulated Android and iPhone; real-device check still recommended)
- [x] Touch controls do not trigger unwanted page scrolling.
- [x] Controls are usable in landscape orientation.
- [x] Menus remain usable in portrait orientation.

## Quality
- [x] Important actions have visible feedback. (pickup text, particles, sounds, camera feedback)
- [x] Audio can be muted and volume adjusted. (Settings, also from the pause menu)
- [x] Focus states and basic keyboard navigation are supported. (focus rings, focus kept inside dialogs)
- [x] No dead or misleading controls remain.
- [x] Tests cover core progression and gameplay helpers.

## Verification notes (Milestone 6)
- **Browsers verified with Playwright:** Chromium desktop, Android landscape (Pixel 7 emulation), Safari/WebKit
  desktop, and iPhone 13 landscape (WebKit). **Firefox not verified:** Playwright's Firefox build failed to launch
  on this development machine (macOS 27, "Could not find profile folder"). Run `npm run test:e2e:cross` on another
  machine or test manually.
- **Performance (headless Chromium, 960×540 internal resolution):** 60 fps (p95 frame time 17 ms) on the heaviest
  levels (Dark Cave, Frozen Castle, Volcano Challenge, Final Guardian), with a JS heap around 45–50 MB. The dark
  level's lighting is rendered at half resolution to keep it at 60 fps. Real low- and mid-range phones have not
  been tested.
- **Bosses:** each boss was defeated by an exploratory bot during development (see LEVEL_DESIGN.md).
