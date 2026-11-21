import { shake } from '../../systems/fx';
import type Phaser from 'phaser';
import { TextureKeys } from '../../config/textureKeys';
import type { BossPlacement } from '../../levels/types';
import type { StompResult } from '../../systems/BossBrain';
import { FrostBrain, type FrostState } from '../../systems/FrostBrain';
import { BossBase, type BossSpawn, type BossTickResult } from './BossBase';

/** Frost Guardian: frost marks appear on alternating segments, then ice spikes erupt there. */
export class FrostBoss extends BossBase {
  readonly brain = new FrostBrain();
  readonly vulnerableText = 'EXHAUSTED!';
  private readonly marks: Phaser.GameObjects.TileSprite[] = [];
  private lastState: FrostState = 'dormant';

  constructor(scene: Phaser.Scene, placement: BossPlacement) {
    super(scene, placement, TextureKeys.FrostIdle);
    this.body.setSize(44, 70).setOffset(10, 10);
  }

  get hp() {
    return this.brain.hp;
  }
  get maxHp() {
    return this.brain.config.maxHp;
  }
  get touchHurtsPlayer() {
    return this.brain.touchHurtsPlayer;
  }
  activate() {
    this.brain.activate();
  }
  stomp(): StompResult {
    return this.brain.stomp();
  }
  protected resetBrain() {
    this.brain.reset();
    this.lastState = 'dormant';
    this.showMarks();
  }

  tick(deltaMs: number, playerX: number): BossTickResult {
    const out = this.brain.update({ deltaMs, x: this.x, playerX, arenaMinX: this.innerMinX, arenaMaxX: this.innerMaxX });
    this.body.setVelocityX(out.vx);
    const spawns: BossSpawn[] = [];
    if (out.event) {
      for (const [x0, x1] of out.event.zones) spawns.push({ kind: 'eruption', x0, x1, y: this.startY, durationMs: out.event.durationMs });
      shake(this.scene, 200, 0.006);
    }
    const state = this.brain.state;
    const changed = state !== this.lastState;
    this.lastState = state;
    this.render(state);
    return { entered: changed && state === 'exhausted' ? 'vulnerable' : changed && state === 'defeated' ? 'defeated' : null, spawns };
  }

  private showMarks(): void {
    const zones = this.brain.state === 'telegraph' ? this.brain.zones : [];
    while (this.marks.length < zones.length) this.marks.push(this.scene.add.tileSprite(0, 0, 32, 10, TextureKeys.FrostMark).setOrigin(0, 1).setDepth(3));
    this.marks.forEach((m, i) => {
      const zone = zones[i];
      m.setVisible(zone !== undefined);
      if (zone) m.setPosition(zone[0], this.startY).setSize(zone[1] - zone[0], 10).setAlpha(0.6 + Math.sin(this.scene.time.now / 70) * 0.4);
    });
  }

  private render(state: FrostState): void {
    this.showMarks();
    this.setFlipX(this.brain.facing > 0);
    this.showWarning(state === 'telegraph');
    const down = state === 'exhausted' || state === 'hurt' || state === 'defeated';
    const casting = state === 'telegraph' || state === 'erupt';
    this.setTexture(down ? TextureKeys.FrostExhausted : casting ? TextureKeys.FrostCasting : TextureKeys.FrostIdle);
    const t = this.scene.time.now;
    if (state === 'hurt') this.setTint(Math.floor(t / 70) % 2 === 0 ? 0xffffff : 0xff5252);
    else this.clearTint();
  }

  override playDefeat(onDone: () => void): void {
    this.marks.forEach((m) => m.setVisible(false));
    super.playDefeat(onDone);
  }
}
