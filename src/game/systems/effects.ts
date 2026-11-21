import type Phaser from 'phaser';

/** Short floating label for in-game feedback (pickups, checkpoints, blocked hits). */
export function floatText(scene: Phaser.Scene, x: number, y: number, text: string, color = '#ffffff'): void {
  const label = scene.add
    .text(x, y, text, {
      fontFamily: '"Trebuchet MS", system-ui, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color,
      stroke: '#1b2a4a',
      strokeThickness: 4,
    })
    .setOrigin(0.5, 1)
    .setDepth(50);
  scene.tweens.add({
    targets: label,
    y: y - 42,
    alpha: 0,
    duration: 900,
    ease: 'Quad.easeOut',
    onComplete: () => label.destroy(),
  });
}
