// Generates the PWA / home-screen icons as PNGs with no image dependencies.
// Run: npm run icons  (outputs to public/icons/)
import { mkdirSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};
function png(size, pixel) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixel(x / size, y / size);
      raw.set([r, g, b, a], y * (size * 4 + 1) + 1 + x * 4);
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6; // RGBA
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16), 255];
const inRoundRect = (u, v, x0, y0, x1, y1, r) => {
  if (u < x0 || u > x1 || v < y0 || v > y1) return false;
  const cx = Math.min(Math.max(u, x0 + r), x1 - r);
  const cy = Math.min(Math.max(v, y0 + r), y1 - r);
  return (u - cx) ** 2 + (v - cy) ** 2 <= r * r;
};

/**
 * Original icon: a red 2x2 brick with studs and a small yellow smiling head on a navy tile.
 * `inset` shrinks the artwork so maskable icons keep everything inside the safe zone.
 */
function icon(u0, v0, { inset = 0, rounded = true } = {}) {
  const bg = hex('#1b2a4a');
  const bgLight = hex('#243a66');
  // Background tile
  if (rounded && !inRoundRect(u0, v0, 0, 0, 1, 1, 0.2)) return [0, 0, 0, 0];
  const s = 1 - inset * 2;
  const u = (u0 - inset) / s;
  const v = (v0 - inset) / s;
  let color = v0 < 0.5 ? bgLight : bg;
  // Brick body + shading
  if (inRoundRect(u, v, 0.14, 0.44, 0.86, 0.86, 0.06)) color = v > 0.78 ? hex('#9e241c') : hex('#d93a2f');
  if (inRoundRect(u, v, 0.18, 0.48, 0.5, 0.53, 0.02)) color = hex('#f2675d');
  // Studs
  for (const cx of [0.3, 0.7]) {
    if (inRoundRect(u, v, cx - 0.11, 0.34, cx + 0.11, 0.46, 0.03)) color = u < cx - 0.02 ? hex('#f2675d') : hex('#c5322a');
  }
  // Little yellow head sitting on the brick
  if (inRoundRect(u, v, 0.37, 0.08, 0.63, 0.34, 0.07)) color = hex('#ffd23f');
  if (inRoundRect(u, v, 0.45, 0.04, 0.55, 0.09, 0.02)) color = hex('#d9a91a');
  const eye = (cx) => (u - cx) ** 2 / 0.0004 + (v - 0.19) ** 2 / 0.0009 <= 1;
  if (eye(0.45) || eye(0.55)) color = hex('#222222');
  const mouthR = Math.hypot(u - 0.5, v - 0.21);
  if (v > 0.23 && mouthR > 0.06 && mouthR < 0.078) color = hex('#222222');
  return color;
}

mkdirSync('public/icons', { recursive: true });
const out = [
  ['icon-192.png', 192, {}],
  ['icon-512.png', 512, {}],
  ['icon-maskable-512.png', 512, { inset: 0.1, rounded: false }],
  ['apple-touch-icon.png', 180, { rounded: false }],
];
for (const [name, size, opts] of out) {
  writeFileSync(`public/icons/${name}`, png(size, (u, v) => icon(u, v, opts)));
  console.log('wrote', name);
}
