# Deployment

LEGO Adventure is a **static single-page app**. There is no backend, database, API key, or environment
variable. All player data (progress, hero and photo, settings) lives in the player's browser.

> Not deployed yet. Publishing publicly needs the project owner's approval (CLAUDE.md, rule 12). Before a public
> release, also choose a final product name: "LEGO" is a trademark of the LEGO Group, and the game is not
> affiliated with or endorsed by it.

## Build
```bash
npm ci
npm run check          # type-check, unit tests, production build
npm run test:e2e       # Chromium desktop + Android-landscape smoke tests
npm run test:e2e:cross # optional: Safari/WebKit, iPhone, Firefox (needs `npx playwright install webkit firefox`)
```
The output is in `dist/`: `index.html`, `favicon.svg`, and content-hashed files in `dist/assets/`.

| File | Size (raw / gzip) | Notes |
|---|---|---|
| `phaser-*.js` | ~1.19 MB / ~320 KB | Phaser 3 runtime, split into its own chunk so it caches across app updates |
| `index-*.js` | ~0.4 MB / ~110 KB | Game and UI code, including all generated art and audio data |
| `index-*.css` | ~16 KB | |

There are no image or audio files to host: all art, music, and sound are generated at runtime.

## Hosting
Any static host works (Netlify, Vercel, Cloudflare Pages, GitHub Pages, S3 + CloudFront, nginx).
- **Serve over HTTPS.** IndexedDB, Web Audio, and touch input work over HTTP on localhost, but production should use HTTPS.
- **Caching:** files in `assets/` are content-hashed. Serve them with `Cache-Control: public, max-age=31536000, immutable`, and serve `index.html` with `no-cache`.
- **Sub-path hosting** (e.g. GitHub Pages at `/lego-adventure/`): build with `npx vite build --base=/lego-adventure/`.
- **No SPA rewrites needed:** navigation is in-app state, not URL routes. `?level=<id>` is a developer shortcut handled client-side.

### nginx example
```nginx
location /assets/ { add_header Cache-Control "public, max-age=31536000, immutable"; }
location = /index.html { add_header Cache-Control "no-cache"; }
```

## Release checklist
- [ ] `npm run check` passes.
- [ ] `npm run test:e2e` passes; run `npm run test:e2e:cross` where browsers are available.
- [ ] Play-test on a real phone (landscape and portrait) and a real desktop browser.
- [ ] Final product name and branding decided (trademark note above).
- [ ] Decide whether to keep the `?level=` developer shortcut (it bypasses unlocks; no security impact since all data is local).
- [ ] Owner approval to publish.

## Privacy notes for hosting
The app makes no network requests after loading. Uploaded photos are processed in the browser and stored only in
that browser's IndexedDB; "Settings › Delete all saved data" removes everything. If analytics or crash reporting
are added later, update this section and the in-app privacy note.
