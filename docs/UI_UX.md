# UI and UX Requirements

## Main menu
- Game title/logo
- Play
- Customize Hero
- World / Level Select
- Settings
- Credits

## Character setup
- Upload image
- File validation and helpful error messages
- Image preview and crop/position adjustment
- Default hero option
- Confirm and continue

## World and level selection
- Five world sections
- Twenty level tiles
- Locked/unlocked/completed states
- Best score or star rating for completed levels
- Clear indication of the next available level

## In-game HUD
- Health (three hearts)
- Coin count
- Brick/token count
- Current level
- Pause control
- Optional timer

## Pause menu
- Resume
- Restart level
- Settings
- Return to level map (confirm if progress may be lost)

## Level complete
- Completion time if enabled
- Collectibles collected
- Deaths or damage summary if used for scoring
- One-to-three-star rating with transparent criteria
- Replay and Next Level actions

## Game over
- Clear explanation
- Restart from checkpoint or level start, depending on design
- Return to level map

## Controls
Desktop:
- Left/right arrows or A/D to move
- Space or configured key to jump
- Optional key for attack
- Escape to pause

Mobile:
- On-screen left and right controls
- Jump button
- Attack button only if combat is enabled
- Thumb-friendly spacing and safe-area padding
- Prevent accidental browser scrolling during gameplay

## Responsive behavior
- Prefer landscape gameplay on phones.
- Show a rotate-device hint only when it improves the experience.
- Menus and upload flow should work in portrait.
- Scale the game canvas while preserving the intended game aspect ratio.
- Keep HUD controls away from notches and browser gesture areas.
- Test both touch and keyboard/mouse navigation.

## Implementation notes
- **Main menu:** Play/Continue (opens the next unfinished level), Level Select, Customize Hero, Settings, How to
  Play, Credits.
- **Level select:** five world sections with 20 level tiles (locked, available/next, or completed with stars and
  best time). After the campaign is complete it also offers "View Ending".
- **Customize Hero:** Take Photo (native camera on phones, live preview on desktop) or Upload Photo → crop →
  choose *Minifig look* (built from the photo's colors, fully editable) or *Photo face* → outfit colors and name → Save.
- **Settings:** master, music, and sound-effect volume; mute; reduce motion (device setting, on, or off); on-screen
  controls (automatic, always, or never); delete all saved data (with confirmation). Settings are also reachable
  from the pause menu.
- **Pause menu:** Resume, Restart Level, Settings, Level Map (with confirmation).
