import { shake } from '../../systems/fx';
import type Phaser from 'phaser';
import { MOVEMENT } from '../../config/movement';
import { TextureKeys } from '../../config/textureKeys';
import type { BossPlacement } from '../../levels/types';
import { BossBrain, GUARDIAN_CONFIG, type StompResult } from '../../systems/BossBrain';
import { FinalPhases } from '../../systems/FinalBrain';
import { PROTECTOR_CONFIG, ProtectorBrain } from '../../systems/ProtectorBrain';
import { BossBase, type BossSpawn, type BossTickResult } from './BossBase';

const RAIN_WARNING_MS = 1100;
const RAIN_SPACING = 220;

/**
 * Final Guardian: four phases alternating the Guardian's charge and the Protector's leap (each phase ends
 * with one stomp in the vulnerable window), with telegraphed boulder rain in the last two phases.
 */
export class FinalBoss extends BossBase {
  readonly phases = new FinalPhases();
  readonly vulnerableText = 'NOW!';
  private charge = new BossBrain({ ...GUARDIAN_CONFIG, maxHp: 1, chargeSpeeds: [320], walkMs: [1600], stunnedMs: 2000 });
  private leap = new ProtectorBrain({ ...PROTECTOR_CONFIG, maxHp: 1, shockwaveSpeeds: [260], idleMs: [1000], leapsPerCycle: [2] });
  private readonly shadow: Phaser.GameObjects.Image;
  private readonly rainMarks: Phaser.GameObjects.Image[] = [];
  private rainXs: number[] = [];
  private rainTimerMs = 0;
  private wasVulnerable = false;
  private finished = false;

  constructor(scene: Phaser.Scene, placement: BossPlacement) {
    super(scene, placement, TextureKeys.FinalIdle);
    this.body.setSize(56, 70).setOffset(8, 10);
    this.shadow = scene.add.image(0, this.startY - 2, TextureKeys.TargetShadow).setDepth(3).setVisible(false);
  }

  get hp() {
    return this.phases.hp;
  }
  get maxHp() {
    return this.phases.config.maxHp;
  }
  private get vulnerable() {
    return this.phases.mode === 'charge' ? this.charge.state === 'stunned' : this.leap.state === 'stuck';
  }
  get touchHurtsPlayer() {
    return this.phases.mode === 'charge' ? this.charge.touchHurtsPlayer : this.leap.touchHurtsPlayer;
  }
  activate() {
    this.activeBrain().activate();
  }
  private activeBrain() {
    return this.phases.mode === 'charge' ? this.charge : this.leap;
  }

  stomp(): StompResult {
    if (!this.vulnerable) return 'bounced';
    this.activeBrain().stomp();
    if (this.phases.hit()) {
      this.finished = true;
    } else {
      // Next phase starts fresh after a short hurt flash.
      this.charge.reset();
      this.leap.reset();
      this.scene.time.delayedCall(800, () => {
        if (!this.finished && this.active) this.activeBrain().activate();
      });
    }
    return 'damaged';
  }

  protected resetBrain() {
    this.phases.reset();
    this.charge.reset();
    this.leap.reset();
    this.finished = false;
    this.rainXs = [];
    this.shadow.setVisible(false);
    this.rainMarks.forEach((m) => m.setVisible(false));
  }

  tick(deltaMs: number, playerX: number): BossTickResult {
    const spawns: BossSpawn[] = [];
    if (this.finished) {
      this.body.setVelocityX(0);
      return { entered: 'defeated', spawns };
    }

    if (this.phases.mode === 'charge') {
      const atWallAhead =
        this.charge.facing < 0 ? this.body.blocked.left || this.body.left <= this.innerMinX + 1 : this.body.blocked.right || this.body.right >= this.innerMaxX - 1;
      this.body.setVelocityX(this.charge.update({ deltaMs, x: this.x, playerX, atWallAhead }));
      this.setFlipX(this.charge.facing > 0);
    } else {
      const command = this.leap.update({ deltaMs, x: this.x, playerX, onGround: this.body.blocked.down, arenaMinX: this.innerMinX, arenaMaxX: this.innerMaxX });
      if (command.type === 'leap') {
        const t = command.durationMs / 1000;
        this.body.setVelocity((command.targetX - this.x) / t, (-MOVEMENT.gravity * t) / 2);
      } else if (command.type === 'land') {
        this.body.setVelocityX(0);
        spawns.push({ kind: 'shockwave', x: this.x - 30, y: this.body.bottom, speed: -command.shockwaveSpeed });
        spawns.push({ kind: 'shockwave', x: this.x + 30, y: this.body.bottom, speed: command.shockwaveSpeed });
        shake(this.scene, 180, 0.008);
      } else if (this.body.blocked.down) {
        this.body.setVelocityX(0);
      }
      this.setFlipX(this.leap.facing > 0);
    }

    // Boulder rain (later phases): marks first, then boulders.
    if (this.phases.updateRain(deltaMs, true) && this.rainXs.length === 0) {
      const xs = [playerX, playerX + RAIN_SPACING, playerX - RAIN_SPACING].filter((x) => x > this.innerMinX + 40 && x < this.innerMaxX - 40);
      this.rainXs = xs.slice(0, this.phases.config.rainBoulders);
      this.rainTimerMs = 0;
    }
    if (this.rainXs.length > 0) {
      this.rainTimerMs += deltaMs;
      if (this.rainTimerMs >= RAIN_WARNING_MS) {
        for (const x of this.rainXs) spawns.push({ kind: 'boulder', x });
        this.rainXs = [];
      }
    }

    const vulnerable = this.vulnerable;
    const entered = vulnerable && !this.wasVulnerable ? 'vulnerable' : null;
    this.wasVulnerable = vulnerable;
    this.render();
    return { entered, spawns };
  }

  private render(): void {
    const t = this.scene.time.now;
    const telegraph = this.phases.mode === 'charge' ? this.charge.state === 'telegraph' : this.leap.state === 'telegraph';
    const attacking = telegraph || this.charge.state === 'charge' || this.leap.state === 'leap';
    this.showWarning(telegraph);
    this.setTexture(this.vulnerable ? TextureKeys.FinalDizzy : attacking ? TextureKeys.FinalAngry : TextureKeys.FinalIdle);
    if (telegraph) this.setTint(Math.floor(t / 100) % 2 === 0 ? 0xffd180 : 0xffffff);
    else this.clearTint();
    this.setAngle(this.vulnerable ? Math.sin(t / 100) * 5 : 0);

    const showShadow = this.phases.mode === 'leap' && this.leap.showsTarget;
    this.shadow.setVisible(showShadow).setPosition(this.leap.targetX, this.startY - 2);
    while (this.rainMarks.length < this.rainXs.length) this.rainMarks.push(this.scene.add.image(0, 0, TextureKeys.BoulderMark).setDepth(3));
    this.rainMarks.forEach((m, i) => {
      const x = this.rainXs[i];
      m.setVisible(x !== undefined);
      if (x !== undefined) m.setPosition(x, this.startY - 4).setAlpha(0.6 + Math.sin(t / 80) * 0.4);
    });
  }

  override playDefeat(onDone: () => void): void {
    this.shadow.setVisible(false);
    this.rainMarks.forEach((m) => m.setVisible(false));
    super.playDefeat(onDone);
  }
}
