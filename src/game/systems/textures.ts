import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, TILE_SIZE } from '../config/constants';
import { AnimationKeys, TextureKeys } from '../config/textureKeys';
import { THEMES, THEME_IDS, themedKey, type ThemePalette } from '../config/themes';
import { HERO_POSES, renderHeroCanvas, type HeroPose } from '../../features/character/heroRenderer';
import type { HeroAppearance } from '../../features/character/types';

/**
 * Generates all Milestone 1 art procedurally so the game ships with no external
 * image assets. Everything here is original, brick-inspired placeholder art.
 */

const STUD_HEIGHT = 4;

type Graphics = Phaser.GameObjects.Graphics;

function bake(scene: Phaser.Scene, key: string, width: number, height: number, draw: (g: Graphics) => void): void {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  draw(g);
  g.generateTexture(key, width, height);
  g.destroy();
}

/** A brick tile: studs along the top, a body with highlight/shadow edges. */
function drawStuddedBrick(g: Graphics, base: number, light: number, dark: number): void {
  const s = TILE_SIZE;
  g.fillStyle(base).fillRect(0, STUD_HEIGHT, s, s - STUD_HEIGHT);
  g.fillStyle(light).fillRect(0, STUD_HEIGHT, s, 3);
  g.fillStyle(dark).fillRect(0, s - 3, s, 3).fillRect(s - 2, STUD_HEIGHT, 2, s - STUD_HEIGHT);
  for (const cx of [8, 24]) {
    g.fillStyle(dark).fillRect(cx - 5, 1, 10, STUD_HEIGHT);
    g.fillStyle(light).fillRect(cx - 5, 0, 9, STUD_HEIGHT);
  }
}

function drawFillBrick(g: Graphics, [base, seam, highlight]: [number, number, number]): void {
  const s = TILE_SIZE;
  g.fillStyle(base).fillRect(0, 0, s, s);
  g.fillStyle(seam);
  // Offset running-bond seams
  g.fillRect(0, 15, s, 2).fillRect(0, 31, s, 1);
  g.fillRect(15, 0, 2, 15).fillRect(0, 17, 1, 14).fillRect(31, 17, 1, 14);
  g.fillStyle(highlight).fillRect(2, 2, 11, 2).fillRect(19, 2, 11, 2).fillRect(3, 19, 11, 2);
}

function drawCoin(g: Graphics): void {
  g.fillStyle(0xb8860b).fillCircle(12, 12, 11);
  g.fillStyle(0xffcc33).fillCircle(12, 12, 9);
  g.fillStyle(0xffe680).fillCircle(10, 10, 4);
  g.lineStyle(2, 0xb8860b).strokeCircle(12, 12, 6);
}

function drawBrickToken(g: Graphics): void {
  g.fillStyle(0x1d5bb5).fillRoundedRect(0, 6, 28, 20, 3);
  g.fillStyle(0x3a86ef).fillRoundedRect(0, 6, 28, 16, 3);
  for (const cx of [7, 21]) {
    g.fillStyle(0x1d5bb5).fillRect(cx - 5, 1, 10, 7);
    g.fillStyle(0x6aa8ff).fillRect(cx - 5, 0, 9, 6);
  }
  g.lineStyle(2, 0xffffff, 0.8).strokeRoundedRect(1, 7, 26, 18, 3);
}

function drawGoalFlag(g: Graphics): void {
  // 48 x 160: pole with a checkered brick flag and a base block.
  g.fillStyle(0x9aa3ad).fillRect(20, 8, 6, 140);
  g.fillStyle(0xd8dee4).fillRect(21, 8, 2, 140);
  g.fillStyle(0xffcc33).fillCircle(23, 8, 7);
  g.fillStyle(0x2e9e4f).fillRect(26, 14, 22, 30);
  g.fillStyle(0xffffff);
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 2; col++) {
      if ((row + col) % 2 === 0) g.fillRect(26 + col * 11, 14 + row * 10, 11, 10);
    }
  }
  g.fillStyle(0x4a5560).fillRect(8, 146, 32, 14);
  g.fillStyle(0x6b7884).fillRect(8, 146, 32, 4);
}

function drawSky(g: Graphics, top: number, bottom: number): void {
  g.fillGradientStyle(top, top, bottom, bottom, 1).fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
}

/** Far parallax layer, 640 x 260, anchored to the bottom of the screen. */
function drawFarLayer(g: Graphics, palette: ThemePalette): void {
  const [main, light] = palette.far;
  if (palette.backdrop === 'hills') {
    g.fillStyle(main);
    g.fillCircle(90, 200, 120).fillCircle(330, 230, 150).fillCircle(520, 210, 100);
    g.fillStyle(light);
    for (const [x, y] of [[90, 95], [300, 95], [520, 125]] as const) g.fillRect(x - 6, y, 12, 4);
  } else if (palette.backdrop === 'trees') {
    // Shapes stay inside the 640 x 260 texture so the layer tiles without hard edges.
    for (const [x, h, r] of [[70, 150, 55], [210, 170, 70], [340, 140, 55], [470, 165, 72], [575, 150, 50]] as const) {
      g.fillStyle(0x24402c).fillRect(x - 8, 260 - h, 16, h);
      g.fillStyle(main).fillCircle(x, 260 - h, r).fillCircle(x - r * 0.6, 260 - h + r * 0.4, r * 0.7).fillCircle(x + r * 0.6, 260 - h + r * 0.4, r * 0.7);
      g.fillStyle(light).fillCircle(x - r * 0.3, 260 - h - r * 0.3, r * 0.35);
    }
  } else if (palette.backdrop === 'dunes') {
    g.fillStyle(main).fillEllipse(180, 250, 340, 150).fillEllipse(460, 255, 330, 160);
    g.fillStyle(light).fillEllipse(180, 230, 200, 60).fillEllipse(460, 240, 220, 70);
    // A distant pyramid
    g.fillStyle(0xd19a4a).fillTriangle(300, 200, 360, 120, 420, 200);
    g.fillStyle(0xb8823a).fillTriangle(360, 120, 420, 200, 380, 200);
  } else if (palette.backdrop === 'mountains') {
    for (const [x, w, h] of [[90, 190, 190], [300, 240, 230], [520, 200, 170]] as const) {
      g.fillStyle(main).fillTriangle(x - w / 2, 260, x, 260 - h, x + w / 2, 260);
      g.fillStyle(light).fillTriangle(x - w * 0.14, 260 - h * 0.72, x, 260 - h, x + w * 0.14, 260 - h * 0.72);
    }
  } else if (palette.backdrop === 'castle') {
    g.fillStyle(main);
    for (const [x, w, h] of [[60, 70, 170], [180, 110, 120], [330, 80, 210], [470, 120, 140], [590, 70, 180]] as const) {
      g.fillRect(x - w / 2, 260 - h, w, h);
      for (let i = 0; i < w; i += 18) g.fillRect(x - w / 2 + i, 260 - h - 10, 10, 10);
    }
    g.fillStyle(light).fillRect(325, 120, 10, 16).fillRect(172, 170, 8, 12).fillRect(585, 120, 8, 14);
  } else if (palette.backdrop === 'volcano') {
    // Volcano cone with a glowing crater and lava trickling down both slopes.
    g.fillStyle(main).fillTriangle(140, 260, 290, 60, 500, 260).fillRect(290, 60, 60, 4);
    g.fillTriangle(290, 60, 350, 60, 500, 260);
    g.fillStyle(0xff6a1a, 0.55).fillEllipse(320, 60, 70, 16);
    g.fillStyle(0xffc02e, 0.8).fillEllipse(320, 58, 40, 8);
    g.lineStyle(3, 0xff6a1a, 0.7).lineBetween(305, 64, 270, 140).lineBetween(270, 140, 262, 190).lineBetween(338, 64, 372, 130);
    g.fillStyle(light).fillTriangle(250, 120, 290, 60, 300, 120);
    g.fillStyle(main).fillTriangle(0, 260, 60, 180, 140, 260).fillTriangle(520, 260, 590, 170, 640, 260);
  } else {
    // Cave: jagged rock silhouettes with a few crystal glints.
    g.fillStyle(main);
    g.fillTriangle(0, 260, 80, 90, 170, 260).fillTriangle(130, 260, 260, 60, 380, 260).fillTriangle(340, 260, 450, 120, 560, 260);
    g.fillTriangle(500, 260, 600, 70, 640, 260);
    g.fillStyle(light).fillTriangle(250, 120, 262, 90, 272, 120).fillTriangle(590, 140, 600, 112, 610, 140);
    g.fillStyle(0x5cc4d6, 0.7).fillTriangle(90, 200, 98, 176, 106, 200).fillTriangle(450, 210, 458, 186, 466, 210);
  }
}

/** Top parallax layer, 760 x 160, anchored near the top of the screen. */
function drawTopLayer(g: Graphics, palette: ThemePalette): void {
  if (palette.top === 'clouds') {
    g.fillStyle(0xffffff, 0.9);
    for (const [x, y] of [[80, 60], [360, 110], [600, 40]] as const) {
      g.fillRoundedRect(x, y, 110, 26, 13).fillRoundedRect(x + 22, y - 14, 60, 26, 13);
    }
  } else if (palette.top === 'mist') {
    g.fillStyle(0xdff5e3, 0.12);
    for (const [x, y, w] of [[150, 90, 260], [440, 120, 260], [660, 70, 160]] as const) g.fillEllipse(x, y, w, 40);
    g.fillStyle(0xfff3a0, 0.8);
    for (const [x, y] of [[120, 40], [300, 80], [520, 30], [690, 110]] as const) g.fillCircle(x, y, 2);
  } else if (palette.top === 'haze') {
    g.fillStyle(palette.topColor, 0.25);
    for (const [x, y, w] of [[140, 60, 240], [420, 100, 260], [650, 40, 180]] as const) g.fillEllipse(x, y, w, 14);
  } else if (palette.top === 'snow' || palette.top === 'embers') {
    g.fillStyle(palette.topColor, 0.85);
    for (let i = 0; i < 46; i++) {
      const x = (i * 137) % 750 + 5;
      const y = (i * 71) % 150 + 5;
      g.fillCircle(x, y, palette.top === 'snow' ? 2 + (i % 2) : 1.5);
    }
  } else {
    g.fillStyle(palette.topColor);
    for (let x = 0; x < 760; x += 38) {
      const h = 30 + ((x * 37) % 70);
      g.fillTriangle(x, 0, x + 30, 0, x + 15, h);
    }
  }
}

function drawSpikes(g: Graphics): void {
  // Base plate plus three steel spikes; the shape (not just color) reads as dangerous.
  const s = TILE_SIZE;
  g.fillStyle(0x4a5560).fillRect(0, s - 6, s, 6);
  for (let i = 0; i < 3; i++) {
    const x = i * 11;
    g.fillStyle(0x8d99a6).fillTriangle(x, s - 6, x + 10, s - 6, x + 5, s - 20);
    g.fillStyle(0xd8dee4).fillTriangle(x + 3, s - 6, x + 5, s - 6, x + 5, s - 18);
  }
}

function drawCheckpoint(g: Graphics, active: boolean): void {
  // 32 x 64: short pole, flag (raised when active), brick base.
  g.fillStyle(0x9aa3ad).fillRect(8, 4, 4, 54);
  g.fillStyle(active ? 0xffcc33 : 0x8d99a6).fillCircle(10, 4, 4);
  if (active) {
    g.fillStyle(0xffcc33).fillTriangle(12, 6, 30, 13, 12, 20);
    g.fillStyle(0xffffff).fillRect(15, 11, 4, 4);
  } else {
    g.fillStyle(0xc0c6cc).fillTriangle(12, 34, 26, 40, 12, 46);
  }
  g.fillStyle(0x4a5560).fillRect(2, 56, 16, 8);
  g.fillStyle(0x6b7884).fillRect(4, 54, 4, 2).fillRect(12, 54, 4, 2);
}

/** "Brick Beetle": a 2x1 brick body on little legs. */
function drawWalker(g: Graphics, frame: 0 | 1): void {
  const legShift = frame === 0 ? 0 : 3;
  g.fillStyle(0x3b2a1a);
  g.fillRect(5 + legShift, 22, 4, 6).fillRect(23 - legShift, 22, 4, 6);
  g.fillStyle(0x7b3fa0).fillRoundedRect(1, 8, 30, 16, 4);
  g.fillStyle(0x9b5cc4).fillRect(3, 9, 26, 3);
  g.fillStyle(0x5a2a78).fillRect(8, 4, 6, 5).fillRect(18, 4, 6, 5);
  // Angry eyes: white with dark pupils and slanted brows
  g.fillStyle(0xffffff).fillRect(7, 13, 6, 6).fillRect(19, 13, 6, 6);
  g.fillStyle(0x111111).fillRect(9, 15, 3, 3).fillRect(20, 15, 3, 3);
  g.fillRect(6, 11, 7, 2).fillRect(19, 11, 7, 2);
}

/** "Buzz Brick": a small round brick with wings. */
function drawFlyer(g: Graphics, frame: 0 | 1): void {
  g.fillStyle(0xffffff, 0.85);
  if (frame === 0) g.fillEllipse(8, 6, 14, 8).fillEllipse(24, 6, 14, 8);
  else g.fillEllipse(6, 12, 12, 6).fillEllipse(26, 12, 12, 6);
  g.fillStyle(0xe07a1f).fillCircle(16, 15, 9);
  g.fillStyle(0xf5a04a).fillCircle(14, 12, 3);
  g.fillStyle(0x111111).fillRect(11, 14, 3, 3).fillRect(18, 14, 3, 3);
  g.fillStyle(0x6b3a0a).fillTriangle(14, 23, 18, 23, 16, 28);
}

function drawShieldBubble(g: Graphics): void {
  g.fillStyle(0x6ad1ff, 0.18).fillCircle(32, 32, 30);
  g.lineStyle(3, 0x9fe3ff, 0.9).strokeCircle(32, 32, 30);
  g.lineStyle(2, 0xffffff, 0.8).beginPath().arc(32, 32, 24, -2.4, -1.6).strokePath();
}

function drawHeartShape(g: Graphics, cx: number, cy: number, size: number): void {
  const r = size / 4;
  g.fillCircle(cx - r, cy - r / 2, r).fillCircle(cx + r, cy - r / 2, r);
  g.fillTriangle(cx - 2 * r, cy - r / 4, cx + 2 * r, cy - r / 4, cx, cy + 1.6 * r);
}

/** Power-up capsule: colored brick tile with a distinct white symbol per kind. */
function drawPowerUp(g: Graphics, kind: 'superJump' | 'speedBoost' | 'shield' | 'extraHeart'): void {
  const colors = { superJump: 0x2e9e4f, speedBoost: 0xe07a1f, shield: 0x2f7de1, extraHeart: 0xd93a2f } as const;
  g.fillStyle(0xffffff).fillRoundedRect(0, 0, 30, 30, 8);
  g.fillStyle(colors[kind]).fillRoundedRect(2, 2, 26, 26, 7);
  g.fillStyle(0xffffff);
  switch (kind) {
    case 'superJump': // up arrow over a spring
      g.fillTriangle(15, 5, 23, 14, 7, 14).fillRect(12, 14, 6, 5);
      g.fillRect(8, 21, 14, 2).fillRect(10, 24, 10, 2);
      break;
    case 'speedBoost': // double chevron
      g.fillTriangle(6, 7, 15, 15, 6, 23).fillTriangle(15, 7, 24, 15, 15, 23);
      g.fillStyle(colors.speedBoost).fillTriangle(6, 12, 10, 15, 6, 18).fillTriangle(15, 12, 19, 15, 15, 18);
      break;
    case 'shield':
      g.fillRect(8, 6, 14, 10).fillTriangle(8, 16, 22, 16, 15, 25);
      g.fillStyle(colors.shield).fillRect(14, 9, 2, 10);
      break;
    case 'extraHeart':
      drawHeartShape(g, 15, 15, 18);
      break;
  }
}

function drawGateBrick(g: Graphics): void {
  const s = TILE_SIZE;
  g.fillStyle(0x6b7884).fillRect(0, 0, s, s);
  g.fillStyle(0x4a5560).fillRect(0, 15, s, 2).fillRect(15, 0, 2, 15).fillRect(7, 17, 2, 15).fillRect(23, 17, 2, 15);
  g.fillStyle(0x8d99a6).fillRect(2, 2, 11, 2).fillRect(19, 2, 11, 2).fillRect(10, 19, 11, 2);
}

function drawBush(g: Graphics): void {
  // 48 x 28
  g.fillStyle(0x2b7a36).fillCircle(12, 18, 10).fillCircle(36, 18, 10).fillCircle(24, 13, 13);
  g.fillStyle(0x3fa34d).fillCircle(12, 17, 8).fillCircle(36, 17, 8).fillCircle(24, 12, 11);
  g.fillStyle(0x6fcf6b).fillCircle(20, 8, 4).fillCircle(33, 12, 3);
  g.fillStyle(0x2b7a36).fillRect(2, 24, 44, 4);
}

function drawFlower(g: Graphics): void {
  // 20 x 28
  g.fillStyle(0x2e9e4f).fillRect(9, 10, 3, 18).fillEllipse(6, 20, 8, 4).fillEllipse(15, 17, 8, 4);
  g.fillStyle(0xff7aa8);
  for (const [x, y] of [[10, 3], [16, 7], [14, 13], [6, 13], [4, 7]] as const) g.fillCircle(x, y, 4);
  g.fillStyle(0xffcc33).fillCircle(10, 8, 3);
}

function drawMushroom(g: Graphics): void {
  // 32 x 32: cream stem, red cap with white dots
  g.fillStyle(0xf3e3c3).fillRoundedRect(11, 14, 10, 18, 3);
  g.fillStyle(0xd9c6a0).fillRect(11, 28, 10, 4);
  g.fillStyle(0xb4271f).fillEllipse(16, 13, 32, 22);
  g.fillStyle(0xe5372c).fillEllipse(16, 11, 30, 18);
  g.fillStyle(0xffffff).fillCircle(9, 9, 3).fillCircle(20, 6, 3).fillCircle(24, 13, 2);
}

function drawSignPost(g: Graphics): void {
  // 8 x 36
  g.fillStyle(0x7a4b24).fillRect(1, 0, 6, 36);
  g.fillStyle(0x9a6534).fillRect(1, 0, 2, 36);
}

type BossFace = 'idle' | 'angry' | 'dizzy';

/** "Grassland Guardian": an original mossy brick golem, 64 x 64. */
function drawBoss(g: Graphics, face: BossFace, step: boolean): void {
  const body = face === 'angry' ? 0x6f8f4e : 0x5f8f4e;
  // Feet
  g.fillStyle(0x3d5a30).fillRoundedRect(step ? 8 : 10, 54, 18, 10, 3).fillRoundedRect(step ? 40 : 36, 54, 18, 10, 3);
  // Arms
  g.fillStyle(0x4b7340).fillRoundedRect(0, 26, 12, 22, 4).fillRoundedRect(52, 26, 12, 22, 4);
  // Body block with brick seams
  g.fillStyle(0x3d5a30).fillRoundedRect(6, 12, 52, 46, 8);
  g.fillStyle(body).fillRoundedRect(6, 10, 52, 44, 8);
  g.fillStyle(0x4b7340).fillRect(8, 38, 48, 2).fillRect(31, 40, 2, 14).fillRect(20, 26, 2, 12).fillRect(42, 26, 2, 12);
  // Studs and leafy crown
  for (const x of [16, 28, 40]) {
    g.fillStyle(0x4b7340).fillRect(x, 5, 9, 6);
    g.fillStyle(0x7fae66).fillRect(x, 4, 8, 5);
  }
  g.fillStyle(0x3fa34d).fillTriangle(8, 12, 16, 0, 20, 12).fillTriangle(44, 12, 50, 0, 56, 12);
  // Moss patches
  g.fillStyle(0x7fcf5f, 0.8).fillCircle(14, 46, 4).fillCircle(50, 18, 3);
  // Face
  if (face === 'dizzy') {
    g.lineStyle(3, 0x1b1b1b);
    for (const cx of [22, 42]) {
      g.lineBetween(cx - 4, 18, cx + 4, 26).lineBetween(cx + 4, 18, cx - 4, 26);
    }
    g.fillStyle(0x1b1b1b).fillEllipse(32, 34, 10, 6);
  } else {
    const eye = face === 'angry' ? 0xff3b30 : 0xffe066;
    g.fillStyle(0x1b1b1b).fillRect(15, 17, 14, 11).fillRect(35, 17, 14, 11);
    g.fillStyle(eye).fillRect(18, 20, 8, 5).fillRect(38, 20, 8, 5);
    if (face === 'angry') {
      g.fillStyle(0x1b1b1b).fillTriangle(13, 12, 30, 17, 13, 17).fillTriangle(51, 12, 34, 17, 51, 17);
    }
    g.fillStyle(0x1b1b1b).fillRect(22, 32, 20, 4);
  }
}

function drawBridgePlank(g: Graphics): void {
  // Wooden plank with rope rail posts; 32 x 32 but planks fill the top half visually.
  g.fillStyle(0x6b4423).fillRect(0, 0, 32, 12);
  g.fillStyle(0x8a5a2e).fillRect(1, 1, 14, 9).fillRect(17, 1, 14, 9);
  g.fillStyle(0xa8743f).fillRect(2, 2, 12, 2).fillRect(18, 2, 12, 2);
  g.fillStyle(0x4a2e15).fillRect(15, 0, 2, 12);
  g.fillStyle(0xc9a26b).fillRect(0, 14, 32, 2);
}

function drawCrumblePlank(g: Graphics): void {
  g.fillStyle(0x7a5a3a).fillRect(0, 0, 32, 14);
  g.fillStyle(0x9b7a52).fillRect(1, 1, 30, 4);
  // Cracks make it read as fragile even without color cues.
  g.lineStyle(2, 0x3e2a1c).lineBetween(6, 2, 12, 12).lineBetween(12, 12, 9, 14).lineBetween(22, 0, 19, 7).lineBetween(19, 7, 26, 13);
  g.fillStyle(0x3e2a1c).fillRect(0, 12, 32, 2);
}

function drawSpikeBall(g: Graphics): void {
  // 36 x 36: steel ball with eight spikes.
  const c = 18;
  g.fillStyle(0x8d99a6);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const tip = { x: c + Math.cos(a) * 17, y: c + Math.sin(a) * 17 };
    const l = { x: c + Math.cos(a - 0.35) * 9, y: c + Math.sin(a - 0.35) * 9 };
    const r = { x: c + Math.cos(a + 0.35) * 9, y: c + Math.sin(a + 0.35) * 9 };
    g.fillTriangle(tip.x, tip.y, l.x, l.y, r.x, r.y);
  }
  g.fillStyle(0x4a5560).fillCircle(c, c, 10);
  g.fillStyle(0x6b7884).fillCircle(c, c, 8);
  g.fillStyle(0xd8dee4).fillCircle(c - 3, c - 3, 3);
}

function drawGlowMushroom(g: Graphics): void {
  // 24 x 28, cyan bioluminescent cap.
  g.fillStyle(0x5cc4d6, 0.25).fillCircle(12, 12, 12);
  g.fillStyle(0xe0f7fa).fillRoundedRect(9, 12, 6, 16, 2);
  g.fillStyle(0x2fc4d9).fillEllipse(12, 11, 22, 14);
  g.fillStyle(0xb2f5ff).fillCircle(8, 9, 2).fillCircle(15, 7, 2);
}

/** "Spore Hopper": a squat purple mushroom creature. Frame 1 is stretched mid-hop. */
function drawHopper(g: Graphics, stretched: boolean): void {
  const capY = stretched ? 2 : 6;
  g.fillStyle(0xf3e3c3).fillRoundedRect(8, capY + 10, 16, stretched ? 18 : 14, 4);
  g.fillStyle(0x3d2a1c).fillRect(10, 28, 5, 4).fillRect(18, 28, 5, 4);
  g.fillStyle(0x5e2f8a).fillEllipse(16, capY + 8, 32, stretched ? 16 : 18);
  g.fillStyle(0x8a4fbf).fillEllipse(16, capY + 6, 28, 12);
  g.fillStyle(0xfff3a0).fillCircle(8, capY + 5, 2).fillCircle(17, capY + 2, 2).fillCircle(24, capY + 7, 2);
  g.fillStyle(0x111111).fillRect(11, capY + 16, 3, 4).fillRect(18, capY + 16, 3, 4);
}

type ProtectorPose = 'idle' | 'crouch' | 'stuck';

/** "Forest Protector": an original mossy tree-stump guardian, 72 x 80. */
function drawProtector(g: Graphics, pose: ProtectorPose): void {
  const top = pose === 'crouch' ? 14 : 6;
  // Roots
  g.fillStyle(0x4a2e15);
  g.fillTriangle(4, 80, 18, 62, 24, 80).fillTriangle(48, 80, 54, 62, 68, 80);
  if (pose === 'stuck') g.fillTriangle(0, 80, 10, 70, 14, 80).fillTriangle(58, 80, 62, 70, 72, 80).fillRect(24, 74, 24, 6);
  // Trunk with bark lines
  g.fillStyle(0x5a3e2b).fillRoundedRect(10, top + 14, 52, 80 - top - 14, 10);
  g.fillStyle(0x6f4e37).fillRoundedRect(14, top + 18, 44, 80 - top - 24, 8);
  g.fillStyle(0x4a2e15).fillRect(22, top + 40, 3, 24).fillRect(46, top + 44, 3, 20);
  // Leafy crown with a small purple mushroom
  g.fillStyle(0x2e5e3e).fillEllipse(36, top + 12, 70, 28);
  g.fillStyle(0x3f7a50).fillEllipse(30, top + 8, 50, 18);
  g.fillStyle(0x8a4fbf).fillEllipse(56, top + 2, 18, 10);
  g.fillStyle(0xf3e3c3).fillRect(54, top + 4, 4, 6);
  // Face
  if (pose === 'stuck') {
    g.lineStyle(3, 0x1b1b1b);
    for (const cx of [26, 46]) g.lineBetween(cx - 4, top + 26, cx + 4, top + 34).lineBetween(cx + 4, top + 26, cx - 4, top + 34);
    g.fillStyle(0x1b1b1b).fillEllipse(36, top + 46, 12, 8);
  } else {
    const eye = pose === 'crouch' ? 0xff9f1c : 0xb6ff6e;
    g.fillStyle(0x1b1b1b).fillEllipse(26, top + 30, 14, 12).fillEllipse(46, top + 30, 14, 12);
    g.fillStyle(eye).fillEllipse(26, top + 30, 8, 6).fillEllipse(46, top + 30, 8, 6);
    g.fillStyle(0x1b1b1b).fillRect(28, top + 44, 16, 4);
  }
}

function drawTargetShadow(g: Graphics): void {
  // 80 x 16 ellipse with a dashed warning ring.
  g.fillStyle(0x000000, 0.35).fillEllipse(40, 8, 76, 14);
  g.lineStyle(2, 0xff3b30, 0.9).strokeEllipse(40, 8, 76, 14);
}

function drawShockwave(g: Graphics): void {
  // 28 x 22 green energy ripple.
  g.fillStyle(0x9cff6e, 0.35).fillEllipse(14, 16, 28, 12);
  g.fillStyle(0xb6ff6e).fillTriangle(2, 22, 14, 2, 26, 22);
  g.fillStyle(0xeaffd8).fillTriangle(9, 22, 14, 10, 19, 22);
}

/** Soft radial light used to cut holes in the darkness overlay. */
function bakeLight(scene: Phaser.Scene, key: string, radius: number): void {
  if (scene.textures.exists(key)) return;
  const size = radius * 2;
  const texture = scene.textures.createCanvas(key, size, size);
  if (!texture) return;
  const ctx = texture.getContext();
  const gradient = ctx.createRadialGradient(radius, radius, 0, radius, radius, radius);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.55, 'rgba(255,255,255,0.85)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  texture.refresh();
}

function drawSinkSand(g: Graphics): void {
  g.fillStyle(0xd8a94e).fillRect(0, 0, 32, 32);
  g.fillStyle(0xeccb7e).fillRect(0, 0, 32, 5);
  g.fillStyle(0xb8873a);
  for (const [x, y] of [[5, 10], [18, 14], [9, 22], [24, 25], [14, 4]] as const) g.fillCircle(x, y, 2);
  // Downward chevrons signal "this sinks".
  g.lineStyle(2, 0x9a6a24, 0.8).lineBetween(10, 16, 16, 21).lineBetween(16, 21, 22, 16);
}

function drawSwitch(g: Graphics, pressed: boolean): void {
  // 32 x 16 pressure plate with a glyph.
  g.fillStyle(0x6b5a3a).fillRect(0, 10, 32, 6);
  g.fillStyle(pressed ? 0x3fa34d : 0xe0a23a).fillRoundedRect(4, pressed ? 8 : 3, 24, pressed ? 4 : 8, 2);
  g.fillStyle(0xffffff, 0.8).fillRect(14, pressed ? 9 : 5, 4, 2);
}

function drawDoor(g: Graphics): void {
  g.fillStyle(0x7d5e28).fillRect(0, 0, 32, 32);
  g.fillStyle(0x5a4219).fillRect(0, 0, 32, 2).fillRect(0, 30, 32, 2).fillRect(0, 0, 2, 32).fillRect(30, 0, 2, 32);
  g.fillStyle(0xe0a23a).fillCircle(16, 16, 6);
  g.fillStyle(0x7d5e28).fillCircle(16, 16, 3);
}

function drawWindStreak(g: Graphics): void {
  // 128 x 64 translucent streaks, tiled across a wind zone.
  g.fillStyle(0xfff3d6, 0.6);
  for (const [x, y, w] of [[8, 8, 50], [70, 22, 40], [20, 40, 60], [90, 54, 30]] as const) g.fillRoundedRect(x, y, w, 3, 1.5);
}

function drawIceTile(g: Graphics): void {
  g.fillStyle(0xa8dcf5).fillRect(0, 0, 32, 32);
  g.fillStyle(0xd8f2ff).fillRect(0, 0, 32, 6).fillTriangle(4, 10, 14, 10, 4, 22);
  g.fillStyle(0x7ab8d8).fillRect(0, 30, 32, 2).fillRect(30, 0, 2, 32);
  g.lineStyle(1, 0xffffff, 0.9).lineBetween(18, 14, 26, 22);
}

function drawBoostPad(g: Graphics): void {
  // 32 x 12 right-pointing chevrons (flipped in-game for left pads).
  g.fillStyle(0x2fc4d9).fillRoundedRect(0, 2, 32, 10, 3);
  g.fillStyle(0xffffff);
  g.fillTriangle(4, 4, 12, 7, 4, 10).fillTriangle(14, 4, 22, 7, 14, 10).fillTriangle(24, 4, 31, 7, 24, 10);
}

function drawIcicle(g: Graphics): void {
  // 20 x 36
  g.fillStyle(0xbfe9ff).fillTriangle(0, 0, 20, 0, 10, 36);
  g.fillStyle(0xffffff).fillTriangle(4, 0, 9, 0, 9, 24);
  g.fillStyle(0x8cc7e6).fillRect(0, 0, 20, 3);
}

function drawLava(g: Graphics): void {
  g.fillStyle(0xd9401a).fillRect(0, 0, 32, 32);
  g.fillStyle(0xff7a1a).fillRect(0, 4, 32, 10);
  g.fillStyle(0xffc02e).fillEllipse(8, 6, 12, 5).fillEllipse(24, 9, 10, 4);
  g.fillStyle(0xa52a10).fillCircle(20, 22, 3).fillCircle(6, 26, 2);
}

function drawFlameNozzle(g: Graphics): void {
  g.fillStyle(0x3a2c2c).fillRect(4, 6, 24, 10);
  g.fillStyle(0x5a4545).fillRect(2, 2, 28, 6);
  g.fillStyle(0x1b1212).fillRect(10, 2, 12, 4);
}

function drawFlame(g: Graphics): void {
  // 28 x 32 tileable flame column segment.
  g.fillStyle(0xff5a1a).fillEllipse(14, 16, 26, 36);
  g.fillStyle(0xffa02e).fillEllipse(14, 16, 16, 30);
  g.fillStyle(0xfff3a0).fillEllipse(14, 16, 6, 22);
}

function drawSmoke(g: Graphics): void {
  g.fillStyle(0x9a8f8f, 0.7).fillCircle(10, 14, 8).fillCircle(20, 10, 9).fillCircle(26, 16, 6);
}

function drawTimedPlatform(g: Graphics): void {
  g.fillStyle(0x6a3fa0).fillRect(0, 4, 32, 26);
  g.fillStyle(0x9b6ad6).fillRect(0, 4, 32, 4);
  g.fillStyle(0x6a3fa0).fillRect(5, 0, 10, 5).fillRect(18, 0, 10, 5);
  g.fillStyle(0xd8b8ff).fillCircle(16, 18, 4);
  g.lineStyle(1, 0xd8b8ff).strokeCircle(16, 18, 8);
}

function drawBoulder(g: Graphics): void {
  g.fillStyle(0x6b5a46).fillCircle(18, 18, 17);
  g.fillStyle(0x8a765e).fillCircle(14, 13, 9);
  g.fillStyle(0x4a3d30).fillCircle(24, 24, 4).fillCircle(9, 24, 2);
}

function drawEruption(g: Graphics): void {
  // 32 x 48 ice spike burst.
  g.fillStyle(0x8cd8ff).fillTriangle(2, 48, 10, 6, 18, 48).fillTriangle(14, 48, 22, 0, 30, 48);
  g.fillStyle(0xe6f7ff).fillTriangle(8, 48, 10, 16, 12, 48).fillTriangle(20, 48, 22, 10, 24, 48);
}

function drawFrostMark(g: Graphics): void {
  // 32 x 10 tileable glowing frost patch.
  g.fillStyle(0x8cd8ff, 0.55).fillRect(0, 2, 32, 8);
  g.fillStyle(0xffffff, 0.9);
  for (const x of [4, 14, 24]) g.fillTriangle(x, 10, x + 3, 0, x + 6, 10);
}

function drawBoulderMark(g: Graphics): void {
  g.fillStyle(0x000000, 0.35).fillEllipse(24, 6, 46, 10);
  g.lineStyle(2, 0xff3b30, 0.9).strokeEllipse(24, 6, 46, 10);
}

type BigBossPose = 'idle' | 'angry' | 'down';

/** Pyramid Sentinel: a floating sandstone mask with a turquoise headdress, 72 x 72. */
function drawSentinel(g: Graphics, pose: BigBossPose): void {
  g.fillStyle(0x246060).fillTriangle(4, 30, 20, 4, 20, 60).fillTriangle(68, 30, 52, 4, 52, 60);
  g.fillStyle(0x3a8f8f);
  for (let y = 10; y < 60; y += 10) g.fillRect(6, y, 12, 4).fillRect(54, y, 12, 4);
  g.fillStyle(0xb8873a).fillRoundedRect(16, 4, 40, 64, 10);
  g.fillStyle(0xd9a94e).fillRoundedRect(19, 7, 34, 56, 8);
  g.fillStyle(0xe0a23a).fillRect(30, 66, 12, 6);
  if (pose === 'down') {
    g.lineStyle(3, 0x2a1d0f);
    for (const cx of [28, 44]) g.lineBetween(cx - 4, 22, cx + 4, 30).lineBetween(cx + 4, 22, cx - 4, 30);
  } else {
    const eye = pose === 'angry' ? 0xff3b30 : 0x5cf0e6;
    g.fillStyle(0x2a1d0f).fillRect(22, 22, 12, 9).fillRect(38, 22, 12, 9);
    g.fillStyle(eye).fillRect(25, 24, 7, 5).fillRect(41, 24, 7, 5);
  }
  g.fillStyle(0x2a1d0f).fillRect(30, 46, 12, 3);
  g.fillStyle(0x3a8f8f).fillRect(19, 36, 34, 3);
}

/** Frost Guardian: an ice knight with a crystal crest, 64 x 80. */
function drawFrostGuardian(g: Graphics, pose: BigBossPose): void {
  const top = pose === 'down' ? 16 : 4;
  g.fillStyle(0x3d546f).fillRoundedRect(14, top + 30, 36, 80 - top - 30, 6);
  g.fillStyle(0x56708f).fillRoundedRect(8, top + 26, 48, 26, 8);
  g.fillStyle(0x8fb8d8).fillRoundedRect(16, top + 4, 32, 28, 8);
  g.fillStyle(0xc6e2f5).fillTriangle(24, top + 6, 32, top - 4, 40, top + 6);
  if (pose === 'down') {
    g.lineStyle(3, 0x1b2a44);
    for (const cx of [26, 38]) g.lineBetween(cx - 3, top + 14, cx + 3, top + 20).lineBetween(cx + 3, top + 14, cx - 3, top + 20);
  } else {
    g.fillStyle(0x1b2a44).fillRect(20, top + 14, 24, 8);
    g.fillStyle(pose === 'angry' ? 0xffffff : 0x5cc4ff).fillRect(23, top + 16, 6, 4).fillRect(35, top + 16, 6, 4);
  }
  if (pose === 'angry') g.fillStyle(0x8cd8ff, 0.5).fillCircle(32, top + 40, 26);
  g.fillStyle(0xc6e2f5).fillRect(0, top + 30, 8, 20).fillRect(56, top + 30, 8, 20);
}

/** Final Guardian: a molten brick colossus, 72 x 80. */
function drawFinalGuardian(g: Graphics, pose: BigBossPose): void {
  g.fillStyle(0x241a1a).fillRoundedRect(10, 70, 22, 10, 3).fillRoundedRect(40, 70, 22, 10, 3);
  g.fillStyle(0x3a2c2c).fillRoundedRect(0, 30, 14, 28, 5).fillRoundedRect(58, 30, 14, 28, 5);
  g.fillStyle(0x3a2c2c).fillRoundedRect(8, 12, 56, 62, 10);
  g.fillStyle(0x5a4545).fillRoundedRect(8, 10, 56, 58, 10);
  // Glowing lava seams
  g.fillStyle(pose === 'angry' ? 0xffc02e : 0xff6a1a);
  g.fillRect(12, 44, 48, 3).fillRect(34, 47, 3, 18).fillRect(20, 28, 3, 14).fillRect(48, 28, 3, 14);
  for (const x of [18, 32, 46]) {
    g.fillStyle(0x3a2c2c).fillRect(x, 4, 10, 8);
    g.fillStyle(0xff6a1a).fillRect(x + 2, 2, 6, 4);
  }
  if (pose === 'down') {
    g.lineStyle(3, 0x1b1212);
    for (const cx of [26, 46]) g.lineBetween(cx - 4, 20, cx + 4, 28).lineBetween(cx + 4, 20, cx - 4, 28);
  } else {
    g.fillStyle(0x1b1212).fillRect(18, 18, 14, 12).fillRect(40, 18, 14, 12);
    g.fillStyle(pose === 'angry' ? 0xffffff : 0xffc02e).fillRect(21, 21, 8, 6).fillRect(43, 21, 8, 6);
  }
  g.fillStyle(0x1b1212).fillRect(26, 34, 20, 4);
}

/** Radii of the generated light textures (px). The player's light is scaled from LightLarge. */
export const LIGHT_LARGE_RADIUS = 200;
export const LIGHT_SMALL_RADIUS = 90;

export function generateTextures(scene: Phaser.Scene): void {
  bake(scene, TextureKeys.Particle, 8, 8, (g) => g.fillStyle(0xffffff).fillCircle(4, 4, 4));
  bake(scene, TextureKeys.SinkSand, TILE_SIZE, TILE_SIZE, drawSinkSand);
  bake(scene, TextureKeys.SwitchUp, 32, 16, (g) => drawSwitch(g, false));
  bake(scene, TextureKeys.SwitchDown, 32, 16, (g) => drawSwitch(g, true));
  bake(scene, TextureKeys.Door, TILE_SIZE, TILE_SIZE, drawDoor);
  bake(scene, TextureKeys.WindStreak, 128, 64, drawWindStreak);
  bake(scene, TextureKeys.Ice, TILE_SIZE, TILE_SIZE, drawIceTile);
  bake(scene, TextureKeys.BoostPad, 32, 12, drawBoostPad);
  bake(scene, TextureKeys.Icicle, 20, 36, drawIcicle);
  bake(scene, TextureKeys.Lava, TILE_SIZE, TILE_SIZE, drawLava);
  bake(scene, TextureKeys.FlameNozzle, 32, 16, drawFlameNozzle);
  bake(scene, TextureKeys.Flame, 28, 32, drawFlame);
  bake(scene, TextureKeys.Smoke, 34, 24, drawSmoke);
  bake(scene, TextureKeys.TimedPlatform, TILE_SIZE, TILE_SIZE, drawTimedPlatform);
  bake(scene, TextureKeys.Boulder, 36, 36, drawBoulder);
  bake(scene, TextureKeys.Eruption, 32, 48, drawEruption);
  bake(scene, TextureKeys.FrostMark, 32, 10, drawFrostMark);
  bake(scene, TextureKeys.BoulderMark, 48, 12, drawBoulderMark);
  bake(scene, TextureKeys.SentinelIdle, 72, 72, (g) => drawSentinel(g, 'idle'));
  bake(scene, TextureKeys.SentinelAngry, 72, 72, (g) => drawSentinel(g, 'angry'));
  bake(scene, TextureKeys.SentinelStunned, 72, 72, (g) => drawSentinel(g, 'down'));
  bake(scene, TextureKeys.FrostIdle, 64, 80, (g) => drawFrostGuardian(g, 'idle'));
  bake(scene, TextureKeys.FrostCasting, 64, 80, (g) => drawFrostGuardian(g, 'angry'));
  bake(scene, TextureKeys.FrostExhausted, 64, 80, (g) => drawFrostGuardian(g, 'down'));
  bake(scene, TextureKeys.FinalIdle, 72, 80, (g) => drawFinalGuardian(g, 'idle'));
  bake(scene, TextureKeys.FinalAngry, 72, 80, (g) => drawFinalGuardian(g, 'angry'));
  bake(scene, TextureKeys.FinalDizzy, 72, 80, (g) => drawFinalGuardian(g, 'down'));
  bake(scene, TextureKeys.Bridge, TILE_SIZE, TILE_SIZE, drawBridgePlank);
  bake(scene, TextureKeys.Crumble, TILE_SIZE, 14, drawCrumblePlank);
  bake(scene, TextureKeys.SpikeBall, 36, 36, drawSpikeBall);
  bake(scene, TextureKeys.GlowMushroom, 24, 28, drawGlowMushroom);
  bake(scene, TextureKeys.Hopper0, 32, 32, (g) => drawHopper(g, false));
  bake(scene, TextureKeys.Hopper1, 32, 32, (g) => drawHopper(g, true));
  bake(scene, TextureKeys.ProtectorIdle, 72, 80, (g) => drawProtector(g, 'idle'));
  bake(scene, TextureKeys.ProtectorCrouch, 72, 80, (g) => drawProtector(g, 'crouch'));
  bake(scene, TextureKeys.ProtectorStuck, 72, 80, (g) => drawProtector(g, 'stuck'));
  bake(scene, TextureKeys.TargetShadow, 80, 16, drawTargetShadow);
  bake(scene, TextureKeys.Shockwave, 28, 22, drawShockwave);
  bakeLight(scene, TextureKeys.LightLarge, LIGHT_LARGE_RADIUS);
  bakeLight(scene, TextureKeys.LightSmall, LIGHT_SMALL_RADIUS);

  bake(scene, TextureKeys.MovingPlatform, TILE_SIZE, TILE_SIZE, (g) => drawStuddedBrick(g, 0xf0b429, 0xffd666, 0xb7841a));
  bake(scene, TextureKeys.Gate, TILE_SIZE, TILE_SIZE, drawGateBrick);
  bake(scene, TextureKeys.Bush, 48, 28, drawBush);
  bake(scene, TextureKeys.Flower, 20, 28, drawFlower);
  bake(scene, TextureKeys.Mushroom, 32, 32, drawMushroom);
  bake(scene, TextureKeys.SignPost, 8, 36, drawSignPost);
  bake(scene, TextureKeys.BossIdle, 64, 64, (g) => drawBoss(g, 'idle', false));
  bake(scene, TextureKeys.BossStep, 64, 64, (g) => drawBoss(g, 'idle', true));
  bake(scene, TextureKeys.BossAngry, 64, 64, (g) => drawBoss(g, 'angry', false));
  bake(scene, TextureKeys.BossDizzy, 64, 64, (g) => drawBoss(g, 'dizzy', false));
  if (!scene.anims.exists(AnimationKeys.BossWalk)) {
    scene.anims.create({
      key: AnimationKeys.BossWalk,
      frames: [{ key: TextureKeys.BossIdle }, { key: TextureKeys.BossStep }],
      frameRate: 4,
      repeat: -1,
    });
  }

  for (const theme of THEME_IDS) {
    const p = THEMES[theme];
    bake(scene, themedKey(TextureKeys.GroundTop, theme), TILE_SIZE, TILE_SIZE, (g) => drawStuddedBrick(g, ...p.groundTop));
    bake(scene, themedKey(TextureKeys.GroundFill, theme), TILE_SIZE, TILE_SIZE, (g) => drawFillBrick(g, p.groundFill));
    bake(scene, themedKey(TextureKeys.Platform, theme), TILE_SIZE, TILE_SIZE, (g) => drawStuddedBrick(g, ...p.platform));
    bake(scene, themedKey(TextureKeys.Sky, theme), GAME_WIDTH, GAME_HEIGHT, (g) => drawSky(g, p.skyTop, p.skyBottom));
    bake(scene, themedKey(TextureKeys.Hills, theme), 640, 260, (g) => drawFarLayer(g, p));
    bake(scene, themedKey(TextureKeys.Clouds, theme), 760, 160, (g) => drawTopLayer(g, p));
  }
  bake(scene, TextureKeys.Coin, 24, 24, drawCoin);
  bake(scene, TextureKeys.Brick, 28, 26, drawBrickToken);
  bake(scene, TextureKeys.GoalFlag, 48, 160, drawGoalFlag);

  bake(scene, TextureKeys.Spikes, TILE_SIZE, TILE_SIZE, drawSpikes);
  bake(scene, TextureKeys.CheckpointIdle, 32, 64, (g) => drawCheckpoint(g, false));
  bake(scene, TextureKeys.CheckpointActive, 32, 64, (g) => drawCheckpoint(g, true));
  bake(scene, TextureKeys.Walker0, 32, 28, (g) => drawWalker(g, 0));
  bake(scene, TextureKeys.Walker1, 32, 28, (g) => drawWalker(g, 1));
  bake(scene, TextureKeys.Flyer0, 32, 30, (g) => drawFlyer(g, 0));
  bake(scene, TextureKeys.Flyer1, 32, 30, (g) => drawFlyer(g, 1));
  bake(scene, TextureKeys.ShieldBubble, 64, 64, drawShieldBubble);
  bake(scene, TextureKeys.PowerUpSuperJump, 30, 30, (g) => drawPowerUp(g, 'superJump'));
  bake(scene, TextureKeys.PowerUpSpeedBoost, 30, 30, (g) => drawPowerUp(g, 'speedBoost'));
  bake(scene, TextureKeys.PowerUpShield, 30, 30, (g) => drawPowerUp(g, 'shield'));
  bake(scene, TextureKeys.PowerUpExtraHeart, 30, 30, (g) => drawPowerUp(g, 'extraHeart'));

  if (!scene.anims.exists(AnimationKeys.WalkerWalk)) {
    scene.anims.create({
      key: AnimationKeys.WalkerWalk,
      frames: [{ key: TextureKeys.Walker0 }, { key: TextureKeys.Walker1 }],
      frameRate: 6,
      repeat: -1,
    });
  }
  if (!scene.anims.exists(AnimationKeys.FlyerFlap)) {
    scene.anims.create({
      key: AnimationKeys.FlyerFlap,
      frames: [{ key: TextureKeys.Flyer0 }, { key: TextureKeys.Flyer1 }],
      frameRate: 12,
      repeat: -1,
    });
  }

}

/** Hero textures are rendered at this multiple of their in-game size for sharper scaling. */
export const HERO_TEXTURE_SCALE = 2;

const HERO_POSE_KEYS: Record<HeroPose, string> = {
  idle: TextureKeys.HeroIdle,
  run0: TextureKeys.HeroRun0,
  run1: TextureKeys.HeroRun1,
  jump: TextureKeys.HeroJump,
  fall: TextureKeys.HeroFall,
  hurt: TextureKeys.HeroHurt,
};

/** Builds hero textures from the player's chosen appearance, using the same renderer as the setup preview. */
export function generateHeroTextures(scene: Phaser.Scene, appearance: HeroAppearance): void {
  for (const pose of HERO_POSES) {
    const key = HERO_POSE_KEYS[pose];
    if (scene.textures.exists(key)) scene.textures.remove(key);
    scene.textures.addCanvas(key, renderHeroCanvas(pose, appearance, HERO_TEXTURE_SCALE));
  }
  if (scene.anims.exists(AnimationKeys.HeroRun)) scene.anims.remove(AnimationKeys.HeroRun);
  scene.anims.create({
    key: AnimationKeys.HeroRun,
    frames: [{ key: TextureKeys.HeroRun0 }, { key: TextureKeys.HeroIdle }, { key: TextureKeys.HeroRun1 }, { key: TextureKeys.HeroIdle }],
    frameRate: 12,
    repeat: -1,
  });
}
