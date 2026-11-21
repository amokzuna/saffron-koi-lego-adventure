import { applyPortraitStyle } from './stylize';
import { HAIR_COLORS, OUTFIT_COLORS, SKIN_TONES, type HeroAppearance, type PortraitSource, type PortraitStyle } from './types';

/**
 * Draws the minifigure-inspired hero with Canvas 2D. Used both by the React preview and to
 * build Phaser textures, so the hero the player approves is exactly the hero they play.
 * All coordinates are in logical hero pixels (HERO_WIDTH x HERO_HEIGHT) and scaled on output.
 */

export const HERO_WIDTH = 40;
export const HERO_HEIGHT = 58;

export type HeroPose = 'idle' | 'run0' | 'run1' | 'jump' | 'fall' | 'hurt';
export const HERO_POSES: readonly HeroPose[] = ['idle', 'run0', 'run1', 'jump', 'fall', 'hurt'];

const INK = '#222222';

/** Skin colors: the chosen tone for drawn heads; classic yellow around photo faces. */
function skinFor(appearance: HeroAppearance): { hex: string; shade: string } {
  return appearance.faceMode === 'minifig' ? SKIN_TONES[appearance.skinTone] : SKIN_TONES.classic;
}

/** Head: a square, rounded "toy head" big enough to show a face at game size. */
const HEAD = { x: 6, y: 3, size: 28, radius: 7 } as const;
const FACE_INSET = 1.5;
/** Resolution of the cached, styled portrait. */
const STYLED_PORTRAIT_SIZE = 112;

const LEG_OFFSETS: Record<HeroPose, [number, number]> = {
  idle: [0, 0],
  run0: [-3, 3],
  run1: [3, -3],
  jump: [-2, 2],
  fall: [2, -1],
  hurt: [-3, 3],
};

function roundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function sourceSize(source: PortraitSource): { width: number; height: number } {
  if (source instanceof HTMLImageElement) return { width: source.naturalWidth, height: source.naturalHeight };
  return { width: source.width, height: source.height };
}

const styledCache = new WeakMap<object, Map<PortraitStyle, HTMLCanvasElement>>();

/** Returns a square, styled copy of the portrait, cached per source image and style. */
export function getStyledPortrait(portrait: PortraitSource, style: PortraitStyle): HTMLCanvasElement {
  let byStyle = styledCache.get(portrait);
  if (!byStyle) {
    byStyle = new Map();
    styledCache.set(portrait, byStyle);
  }
  const cached = byStyle.get(style);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = STYLED_PORTRAIT_SIZE;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  const { width, height } = sourceSize(portrait);
  const side = Math.min(width, height);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(portrait, (width - side) / 2, (height - side) / 2, side, side, 0, 0, STYLED_PORTRAIT_SIZE, STYLED_PORTRAIT_SIZE);
  if (style !== 'original') {
    const data = ctx.getImageData(0, 0, STYLED_PORTRAIT_SIZE, STYLED_PORTRAIT_SIZE);
    applyPortraitStyle(data.data, style);
    ctx.putImageData(data, 0, 0);
  }
  byStyle.set(style, canvas);
  return canvas;
}

function drawDefaultFace(ctx: CanvasRenderingContext2D, pose: HeroPose): void {
  ctx.fillStyle = INK;
  ctx.strokeStyle = INK;
  ctx.lineCap = 'round';
  if (pose === 'hurt') {
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(12.5, 14);
    ctx.lineTo(17, 15.5);
    ctx.moveTo(27.5, 14);
    ctx.lineTo(23, 15.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(20, 22, 2.6, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  roundedRectPath(ctx, 14, 11, 3.2, 5, 1.5);
  ctx.fill();
  roundedRectPath(ctx, 22.8, 11, 3.2, 5, 1.5);
  ctx.fill();
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(20, 18, 6, Math.PI * 0.18, Math.PI * 0.82);
  ctx.stroke();
}

function drawPhotoFace(ctx: CanvasRenderingContext2D, pose: HeroPose, portrait: PortraitSource, style: PortraitStyle): void {
  const face = getStyledPortrait(portrait, style);
  const inner = HEAD.size - FACE_INSET * 2;
  ctx.save();
  roundedRectPath(ctx, HEAD.x + FACE_INSET, HEAD.y + FACE_INSET, inner, inner, HEAD.radius - 1);
  ctx.clip();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(face, HEAD.x + FACE_INSET, HEAD.y + FACE_INSET, inner, inner);
  if (pose === 'hurt') {
    ctx.fillStyle = 'rgba(255, 60, 60, 0.4)';
    ctx.fillRect(HEAD.x, HEAD.y, HEAD.size, HEAD.size);
  }
  ctx.restore();
}

/** Long hair falls behind the head and onto the shoulders. */
function drawHairBack(ctx: CanvasRenderingContext2D, appearance: HeroAppearance): void {
  if (appearance.faceMode !== 'minifig' || appearance.hairStyle !== 'long') return;
  ctx.fillStyle = HAIR_COLORS[appearance.hairColor].hex;
  roundedRectPath(ctx, 3, 6, 9, 30, 4);
  ctx.fill();
  roundedRectPath(ctx, 28, 6, 9, 30, 4);
  ctx.fill();
}

/** Hairpiece on top of the head (covers the stud, like a real minifig hairpiece). */
function drawHairFront(ctx: CanvasRenderingContext2D, appearance: HeroAppearance): void {
  const style = appearance.hairStyle;
  if (style === 'none') return;
  ctx.fillStyle = HAIR_COLORS[appearance.hairColor].hex;
  if (style === 'spiky') {
    roundedRectPath(ctx, 5, 3, 30, 8, 4);
    ctx.fill();
    ctx.beginPath();
    for (const [x0, tip] of [[6, 10], [12, 16], [18, 22], [24, 28], [30, 34]] as const) {
      ctx.moveTo(x0, 6);
      ctx.lineTo(tip - 2, -1);
      ctx.lineTo(x0 + 6, 6);
    }
    ctx.fill();
  } else {
    roundedRectPath(ctx, 4.5, 0.5, 31, 8.5, 6);
    ctx.fill();
    // Side fringe framing the face.
    ctx.beginPath();
    ctx.moveTo(5, 8);
    ctx.lineTo(10, 8);
    ctx.lineTo(6, 15);
    ctx.closePath();
    ctx.moveTo(35, 8);
    ctx.lineTo(29, 8);
    ctx.lineTo(34, 15);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  roundedRectPath(ctx, 9, 2.5, 9, 2.5, 1.2);
  ctx.fill();
}

function drawGlasses(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.3;
  roundedRectPath(ctx, 12, 10, 7, 7, 2);
  ctx.stroke();
  roundedRectPath(ctx, 21, 10, 7, 7, 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(19, 13);
  ctx.lineTo(21, 13);
  ctx.stroke();
}

function drawBrows(ctx: CanvasRenderingContext2D, appearance: HeroAppearance): void {
  if (appearance.hairStyle === 'none') return;
  ctx.strokeStyle = appearance.hairColor === 'white' || appearance.hairColor === 'blonde' || appearance.hairColor === 'gray' ? '#8a6a3a' : INK;
  ctx.lineWidth = 1.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(13.5, 9.6);
  ctx.lineTo(17.5, 9.2);
  ctx.moveTo(22.5, 9.2);
  ctx.lineTo(26.5, 9.6);
  ctx.stroke();
}

function drawHead(ctx: CanvasRenderingContext2D, pose: HeroPose, appearance: HeroAppearance): void {
  const skin = skinFor(appearance);
  const photo = appearance.faceMode === 'photo' && appearance.portrait;
  const hairpiece = !photo && appearance.hairStyle !== 'none';

  drawHairBack(ctx, appearance);

  if (!hairpiece) {
    // Stud on top
    ctx.fillStyle = skin.shade;
    roundedRectPath(ctx, 14, 0, 12, 5, 1.5);
    ctx.fill();
  }

  ctx.fillStyle = skin.hex;
  roundedRectPath(ctx, HEAD.x, HEAD.y, HEAD.size, HEAD.size, HEAD.radius);
  ctx.fill();

  if (photo && appearance.portrait) {
    drawPhotoFace(ctx, pose, appearance.portrait, appearance.style);
  } else {
    drawDefaultFace(ctx, pose);
    drawBrows(ctx, appearance);
    if (appearance.glasses) drawGlasses(ctx);
  }

  // Outline and toy-plastic shine
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
  roundedRectPath(ctx, HEAD.x + 0.5, HEAD.y + 0.5, HEAD.size - 1, HEAD.size - 1, HEAD.radius);
  ctx.stroke();
  if (hairpiece) drawHairFront(ctx, appearance);
  else {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    roundedRectPath(ctx, HEAD.x + 3, HEAD.y + 2.5, 7, 3, 1.5);
    ctx.fill();
  }
}

/** Draws one pose at the given scale into `ctx`, with its top-left at (0, 0). */
export function drawHero(ctx: CanvasRenderingContext2D, pose: HeroPose, appearance: HeroAppearance, scale: number): void {
  const torso = OUTFIT_COLORS[appearance.torsoColor];
  const legs = OUTFIT_COLORS[appearance.legsColor];
  const [lx, rx] = LEG_OFFSETS[pose];
  const armUp = pose === 'jump' || pose === 'hurt' ? -6 : pose === 'fall' ? -3 : 0;

  ctx.save();
  ctx.scale(scale, scale);

  // Legs and hips
  ctx.fillStyle = legs.shade;
  ctx.fillRect(11 + lx, 44, 8, 14);
  ctx.fillStyle = legs.hex;
  ctx.fillRect(21 + rx, 44, 8, 14);
  ctx.fillRect(10, 41, 20, 5);

  // Arms and hands
  ctx.fillStyle = torso.shade;
  ctx.fillRect(4, 32 + armUp, 6, 11);
  ctx.fillRect(30, 32 + armUp, 6, 11);
  const skin = skinFor(appearance);
  ctx.fillStyle = skin.hex;
  ctx.fillRect(4, 42 + armUp, 6, 3);
  ctx.fillRect(30, 42 + armUp, 6, 3);

  // Neck and torso
  ctx.fillStyle = skin.shade;
  ctx.fillRect(16, 29, 8, 3);
  ctx.fillStyle = torso.hex;
  ctx.beginPath();
  ctx.moveTo(12, 31);
  ctx.lineTo(28, 31);
  ctx.lineTo(31, 45);
  ctx.lineTo(9, 45);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffcc33';
  ctx.fillRect(17, 35, 6, 5);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.fillRect(17, 39, 6, 1);

  drawHead(ctx, pose, appearance);
  ctx.restore();
}

/** Creates a canvas containing one pose rendered at `scale`. */
export function renderHeroCanvas(pose: HeroPose, appearance: HeroAppearance, scale: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(HERO_WIDTH * scale);
  canvas.height = Math.round(HERO_HEIGHT * scale);
  drawHero(canvas.getContext('2d')!, pose, appearance, scale);
  return canvas;
}
