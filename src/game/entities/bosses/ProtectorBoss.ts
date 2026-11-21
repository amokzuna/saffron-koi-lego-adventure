import { shake } from '../../systems/fx';
import type Phaser from 'phaser';
import { MOVEMENT } from '../../config/movement';
import { TextureKeys } from '../../config/textureKeys';
import type { BossPlacement } from '../../levels/types';
import type { StompResult } from '../../systems/BossBrain';
import { ProtectorBrain, type ProtectorState } from '../../systems/ProtectorBrain';
import { BossBase, type BossSpawn, type BossTickResult } from './BossBase';

/** Forest Protector: telegraphed leaps onto the player's position, shockwaves on landing, stuck afterwards. */
export class ProtectorBoss extends BossBase {
  readonly brain = new ProtectorBrain();
  readonly vulnerableText = 'STUCK!';
  private readonly shadow: Phaser.GameObjects.Image;
  private lastState: ProtectorState = 'dormant';

  constructor(scene: Phaser.Scene, placement: BossPlacement) {
    super(scene, placement, TextureKeys.ProtectorIdle);
    this.body.setSize(56, 70).setOffset(8, 10);
    this.shadow = scene.add.image(this.x, this.startY, TextureKeys.TargetShadow).setOrigin(0.5, 0.5).setDepth(3).setVisible(false);
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
    this.shadow.setVisible(false);
    this.render('dormant');
  }

  tick(deltaMs: number, playerX: number): BossTickResult {
    const command = this.brain.update({
      deltaMs,
      x: this.x,
      playerX,
      onGround: this.body.blocked.down,
      arenaMinX: this.innerMinX,
      arenaMaxX: this.innerMaxX,
    });

    const spawns: BossSpawn[] = [];
    if (command.type === 'leap') {
      // Ballistic arc landing on targetX after durationMs under world gravity.
      const t = command.durationMs / 1000;
      this.body.setVelocity((command.targetX - this.x) / t, (-MOVEMENT.gravity * t) / 2);
    } else if (command.type === 'land') {
      this.body.setVelocityX(0);
      const groundY = this.body.bottom;
      spawns.push(
        { kind: 'shockwave', x: this.x - 30, y: groundY, speed: -command.shockwaveSpeed },
        { kind: 'shockwave', x: this.x + 30, y: groundY, speed: command.shockwaveSpeed },
      );
      shake(this.scene, 180, 0.008);
    } else if (this.body.blocked.down) {
      this.body.setVelocityX(0);
    }

    const state = this.brain.state;
    const changed = state !== this.lastState;
    this.lastState = state;
    this.render(state);
    return {
      entered: changed && state === 'stuck' ? 'vulnerable' : changed && state === 'defeated' ? 'defeated' : null,
      spawns,
    };
  }

  private render(state: ProtectorState): void {
    this.setFlipX(this.brain.facing > 0);
    this.showWarning(state === 'telegraph');
    this.shadow.setVisible(this.brain.showsTarget).setPosition(this.brain.targetX, this.startY - 2);
    const t = this.scene.time.now;
    if (this.brain.showsTarget) this.shadow.setAlpha(0.6 + Math.sin(t / 80) * 0.4);

    const texture =
      state === 'telegraph' ? TextureKeys.ProtectorCrouch : state === 'stuck' || state === 'hurt' || state === 'defeated' ? TextureKeys.ProtectorStuck : TextureKeys.ProtectorIdle;
    this.setTexture(texture);
    if (state === 'telegraph') this.setTint(Math.floor(t / 100) % 2 === 0 ? 0xffd180 : 0xffffff);
    else if (state === 'hurt') this.setTint(Math.floor(t / 70) % 2 === 0 ? 0xffffff : 0xff5252);
    else this.clearTint();
    this.setAngle(state === 'stuck' ? Math.sin(t / 110) * 3 : 0);
  }

  override playDefeat(onDone: () => void): void {
    this.shadow.setVisible(false);
    super.playDefeat(onDone);
  }
}
