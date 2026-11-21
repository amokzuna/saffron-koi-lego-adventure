# Custom Character and Image Pipeline

## Goal
Let a player upload an image and use a recognizable, minifigure-inspired hero in the game.

## Important distinction
A single uploaded portrait is not automatically a complete animated game character. A playable animated character needs consistent views/poses and a sprite sheet or rig. The implementation must make this limitation clear.

## Initial implementation
1. Let the user choose a PNG, JPG, or WebP image.
2. Validate file size and image dimensions.
3. Show a preview and allow crop/position adjustments.
4. Create a temporary character profile with the source image and user-approved display name.
5. Use a placeholder minifigure body/sprite and map the uploaded portrait or selected features to it where technically feasible.
6. Let the player confirm the appearance before entering the game.

## Future stylization options
A later image-processing step may create a minifigure-inspired design. If using an external AI image service:
- Explain what image is sent and to whom.
- Obtain clear consent before upload.
- Handle service errors and rate limits.
- Do not promise a result before it is returned.
- Keep the original upload separate from generated output.
- Allow the user to replace or delete their image.

## Animation requirements
A game-ready character needs consistent frames for:
- Idle
- Run
- Jump ascent
- Fall
- Land
- Hurt
- Attack (if combat is implemented)
- Victory

Maintain consistent scale, proportions, palette, camera angle, and transparent background across frames. Use a sprite atlas with metadata or a rigged character. Verify that animation frames align and collision bounds remain stable.

## Privacy and storage
- Keep uploads private by default.
- Do not log image contents.
- Explain local vs cloud storage.
- Provide a delete/replace action.
- Avoid storing large binary images in localStorage; use IndexedDB for local persistence.

## Implemented approach (Milestone 3)
**Stylization strategy: local, in-browser, no AI service.** No image is ever sent anywhere. An external AI
stylization step remains a possible future option and would require explicit approval and user consent
(see "Future stylization options" above).

### Flow
1. **Choose file** (`Upload Photo`): PNG, JPG, or WebP. Validated by *content* (magic bytes), not file name or
   MIME type. Limits: 10 MB, 64–8192 px per side. Each failure has a specific, user-facing message
   (`src/features/character/imageValidation.ts`).
2. **Decode** in the browser (`createImageBitmap`, `<img>` fallback). Photos larger than 2048 px are downscaled
   for the editor. Decode failures show "couldn't read that image".
3. **Crop**: square crop with drag (mouse/touch), arrow keys, `+`/`-`, and a zoom slider (1–5x). Crop math is in
   `crop.ts` (pure, unit-tested). Portrait photos start biased toward the top, where faces usually are.
4. **Style**: `Toy colors` (saturation 1.35x, contrast 1.1x, posterized to 6 levels/channel), `Classic yellow`
   (luminance mapped onto a 5-band yellow toy-skin ramp, so features survive as shading), or `Original`.
   Pure pixel functions in `stylize.ts`.
5. **Outfit and name**: shirt and pants colors (8 options each, labelled, not color-only) and a 1–16 character name.
6. **Confirm**: `Save Hero` persists; `Cancel` discards all edits; `Remove Photo` and `Reset to Default Hero`
   take effect on save.

### Rendering — one renderer for preview and game
`heroRenderer.ts` draws the hero with Canvas 2D: a minifigure-inspired body plus a square, rounded "toy head"
(with stud and outline) where the styled portrait is clipped in. The **same function** draws the setup preview
and builds the Phaser textures (rendered at 2x and scaled down in-game), so the approved preview and the
in-game hero are guaranteed to match.

### Animation — what is and isn't animated
The body has six frames (idle, two run frames, jump, fall, hurt). The portrait is composited onto each frame's
head; the **face itself is a still image** (the hurt frame adds a red tint). The setup screen states this.
No sprite-sheet generation from photos exists or is claimed.

### Storage
| Data | Where | Notes |
|---|---|---|
| Hero profile (name, colors, style, `hasPortrait`) | `localStorage` key `lego-adventure:hero` | Versioned (`version: 1`); `parseHeroProfile` repairs invalid fields and falls back to defaults for unknown versions or corrupt JSON. |
| Cropped portrait (160x160 PNG, unstyled) | IndexedDB `lego-adventure` / `images` / `hero-portrait` | Style is applied at render time, so it can change without re-uploading. |
| Original upload | **Not stored** | Re-cropping requires choosing the photo again. |

- If the profile says there is a portrait but it can't be loaded, the default face is used and the menu shows
  a notice.
- If saving fails (private browsing, storage disabled/full), the setup screen explains why and offers
  **Use This Hero Without Saving** (session only; the menu says "Not saved on this device").
- Removing the photo deletes the IndexedDB entry on save.

## Camera capture and minifig builder (update)
### Photo sources
- **Take Photo:** on touch devices it opens the native camera (`<input type="file" accept="image/*" capture="user">`).
  On desktop it opens an in-page camera preview (`getUserMedia`, front camera, mirrored like a selfie) with a face
  guide and a **Capture** button. Blocked permission, a missing camera, a camera in use, or a non-secure
  connection each show a specific message that suggests uploading instead. The camera stream stops when the dialog
  closes, and the setup screen behind the dialog is `inert`.
- **Upload Photo:** as before.
- Both paths go through the same validation, decoding, and crop flow.

### Building a minifig from the photo (on-device)
`analyzePhoto.ts` (pure, unit-tested) samples the cropped face and the area just below it
(`photoRegions.ts` reads the pixels):
- **Skin tone:** the median of skin-like pixels in the center of the face, matched to the nearest of six natural
  tones. Classic yellow stays available as a choice.
- **Hair:** the median of a band across the top. If it differs clearly from the skin it counts as hair (nearest of
  nine hair colors) and the style is *short*; if the sides of the face match the hair color, *long*; otherwise *no hair*.
- **Shirt:** the median of the area below the crop, when the photo extends there, matched to the outfit colors.

These are **suggestions**: the player can change skin tone, hairstyle (none, short, long, spiky), hair color,
glasses, shirt, and pants, and can re-run the color picking after re-cropping. The renderer draws a minifigure
head with the chosen skin tone (hands match), a hairpiece that covers the stud like a real minifig hairpiece,
brows, the standard eyes and smile, and optional glasses.

This is color matching, not likeness generation: the figure reflects the photo's colors and hair, not facial
features. A true "draw me as a minifigure" result would need an external AI image service, which requires the
owner's approval and player consent (see "Future stylization options").

### Face modes and storage
| Mode | What's on the head | What's saved |
|---|---|---|
| **Minifig look** (default for new photos) | Drawn minifig head | Only the options (skin tone, hair, glasses, colors). **The photo is not stored**, and an earlier stored photo is deleted on save. |
| **Photo face** | The cropped, styled photo | Options plus the 160×160 crop in IndexedDB (as before) |

The hero profile is now `version: 2`. Version 1 saves migrate automatically: a saved photo keeps photo mode;
otherwise the original yellow default head is kept (classic skin, no hair).
