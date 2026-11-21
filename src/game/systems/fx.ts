import type Phaser from 'phaser';
import { TextureKeys } from '../config/textureKeys';

/** Registry key holding the player's reduced-motion preference (set from React via the bridge). */
export const REDUCED_MOTION_KEY = 'reducedMotion';

const reduced = (scene: Phaser.Scene) => scene.registry.get(REDUCED_MOTION_KEY) === true;

/** Camera shake, skipped when reduced motion is on. */
export function shake(scene: Phaser.Scene, durationMs: number, intensity: number): void {
  if (!reduced(scene)) scene.cameras.main.shake(durationMs, intensity);
}

/** Full-screen flash, skipped when reduced motion is on. */
export function flash(scene: Phaser.Scene, durationMs: number, r: number, g: number, b: number): void {
  if (!reduced(scene)) scene.cameras.main.flash(durationMs, r, g, b);
}

/** Small particle burst for feedback (pickups, landings, defeats). Fewer particles with reduced motion. */
export function burst(scene: Phaser.Scene, x: number, y: number, tint: number, count = 10): void {
  const emitter = scene.add.particles(x, y, TextureKeys.Particle, {
    speed: { min: 50, max: 160 },
    angle: { min: 200, max: 340 },
    lifespan: 420,
    scale: { start: 0.9, end: 0 },
    gravityY: 400,
    tint,
    emitting: false,
  });
  emitter.setDepth(30);
  emitter.explode(reduced(scene) ? Math.ceil(count / 3) : count);
  scene.time.delayedCall(600, () => emitter.destroy());
}
