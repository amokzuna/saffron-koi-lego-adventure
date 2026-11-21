# Product Requirements

## 1. Product vision
Create a colorful, approachable, original 2D platform adventure that runs in desktop and mobile web browsers. Its signature feature is a user-created, minifigure-inspired hero based on an image the player uploads.

## 2. Target platforms
- Desktop and laptop browsers
- Mobile browsers on iOS and Android
- Landscape is the preferred gameplay orientation on phones; menus and upload flows should remain usable in portrait.

## 3. Core player journey
1. Open the game and choose Play.
2. Upload an image or use a default hero.
3. Preview and confirm the custom hero.
4. Enter the world map and play unlocked levels.
5. Collect coins and bricks, avoid hazards, defeat enemies, and reach the level exit.
6. Earn a completion rating and unlock the next level.
7. Resume later with saved progress.

## 4. Core gameplay
- 2D side-scrolling movement
- Left/right movement, jump, optional unlockable double jump
- Gravity, collision, camera follow, and stable platform landing
- Health system with three hearts
- Damage feedback and temporary invulnerability after taking damage
- Collectibles and counters
- Checkpoints and respawn
- Moving and breakable platforms where appropriate
- Hazards such as spikes, pits, water, and lava
- Enemies with simple, readable behavior
- Boss encounters at the end of each world
- Pause, restart, victory, and game-over states

## 5. Collectibles and power-ups
Collectibles:
- Coins
- LEGO-style build bricks or tokens
- Optional hidden collectibles

Power-ups:
- Super Jump
- Speed Boost
- Temporary Shield
- Extra Heart
- Fire Projectile
- Coin Magnet

Power-ups must have clear duration, feedback, and balancing rules. Do not add all power-ups to every level.

## 6. Progression
- 20 levels in five worlds, four levels per world
- Levels unlock in sequence initially
- Completed levels can be replayed
- Completion rating based on clear criteria such as collectibles, deaths, and time
- Persist unlocked levels, best results, settings, and selected hero

## 7. Character customization
- Accept PNG, JPG, and WebP image files
- Validate file type and size; show helpful errors
- Preview the uploaded image before confirmation
- Provide crop/position controls if feasible
- Create a minifigure-inspired visual treatment while retaining recognizable user-selected features
- Keep an accessible default hero if the player skips upload
- Do not promise automatic animated sprite generation until implemented and validated

## 8. Accessibility and usability
- Clear controls and readable UI
- Keyboard navigation for menus
- Visible focus states
- Sound and music controls
- Do not rely on color alone to communicate important states
- Provide a way to pause gameplay
- Touch targets should be comfortably sized

## 9. Non-goals for the first release
- Multiplayer
- Real-time online leaderboards
- User-generated level editor
- Native app store packaging
- Complex 3D gameplay
- Paid subscriptions or in-game purchases
