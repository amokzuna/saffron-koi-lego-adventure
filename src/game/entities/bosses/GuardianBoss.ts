import type Phaser from 'phaser';
import { AnimationKeys, TextureKeys } from '../../config/textureKeys';
import type { BossPlacement } from '../../levels/types';
import { BossBrain, type BossState, type StompResult } from '../../systems/BossBrain';
import { BossBase, type BossTickResult } from './BossBase';

/** Grassland Guardian: walks, telegraphs, charges, and is stunned by hitting arena walls. */
export class GuardianBoss extends BossBase {
  readonly brain = new BossBrain();
  readonly vulnerableText = 'DIZZY!';
  private lastState: BossState = 'dormant';

  constructor(scene: Phaser.Scene, placement: BossPlacement) {
    super(scene, placement, TextureKeys.BossIdle);
    this.body.setSize(52, 56).setOffset(6, 8);
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
    this.render('dormant');
  }

  tick(deltaMs: number, playerX: number): BossTickResult {
    const atWallAhead =
      this.brain.facing < 0
        ? this.body.blocked.left || this.body.left <= this.innerMinX + 1
        : this.body.blocked.right || this.body.right >= this.innerMaxX - 1;
    this.body.setVelocityX(this.brain.update({ deltaMs, x: this.x, playerX, atWallAhead }));

    const state = this.brain.state;
    const changed = state !== this.lastState;
    this.lastState = state;
    this.render(state);
    return {
      entered: changed && state === 'stunned' ? 'vulnerable' : changed && state === 'defeated' ? 'defeated' : null,
      spawns: [],
    };
  }

  private render(state: BossState): void {
    this.setFlipX(this.brain.facing > 0);
    this.showWarning(state === 'telegraph');
    if (state === 'walk') {
      this.anims.play(AnimationKeys.BossWalk, true);
    } else {
      this.anims.stop();
      const angry = state === 'telegraph' || state === 'charge';
      const dizzy = state === 'stunned' || state === 'hurt' || state === 'defeated';
      this.setTexture(angry ? TextureKeys.BossAngry : dizzy ? TextureKeys.BossDizzy : TextureKeys.BossIdle);
    }
    const t = this.scene.time.now;
    if (state === 'telegraph') this.setTint(Math.floor(t / 100) % 2 === 0 ? 0xff8a80 : 0xffffff);
    else if (state === 'hurt') this.setTint(Math.floor(t / 70) % 2 === 0 ? 0xffffff : 0xff5252);
    else this.clearTint();
    this.setAngle(state === 'stunned' ? Math.sin(t / 90) * 6 : 0);
  }
}
