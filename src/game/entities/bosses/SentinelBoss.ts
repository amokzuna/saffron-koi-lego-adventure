import { shake } from '../../systems/fx';
import type Phaser from 'phaser';
import { TILE_SIZE } from '../../config/constants';
import { TextureKeys } from '../../config/textureKeys';
import type { BossPlacement } from '../../levels/types';
import type { StompResult } from '../../systems/BossBrain';
import { SentinelBrain, type SentinelState } from '../../systems/SentinelBrain';
import { BossBase, type BossSpawn, type BossTickResult } from './BossBase';

/** Hover height above the ground (px, measured to the boss's feet). */
const HOVER_ABOVE_GROUND = 5 * TILE_SIZE;

/** Pyramid Sentinel: hovers, marks and drops boulders, then slams down and is stunned. */
export class SentinelBoss extends BossBase {
  readonly brain = new SentinelBrain();
  readonly vulnerableText = 'STUNNED!';
  private readonly markers: Phaser.GameObjects.Image[] = [];
  private readonly hoverY: number;
  private lastState: SentinelState = 'dormant';

  constructor(scene: Phaser.Scene, placement: BossPlacement) {
    super(scene, placement, TextureKeys.SentinelIdle);
    this.body.setAllowGravity(false);
    this.body.setSize(48, 64).setOffset(12, 6);
    this.hoverY = this.startY - HOVER_ABOVE_GROUND;
    this.body.reset(this.startX, this.hoverY);
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
    this.showMarkers([]);
  }

  override resetFight(): void {
    super.resetFight();
    this.body.reset(this.startX, this.hoverY);
  }

  tick(deltaMs: number, playerX: number): BossTickResult {
    const out = this.brain.update({
      deltaMs,
      x: this.x,
      playerX,
      onGround: this.body.blocked.down,
      atHoverHeight: this.y <= this.hoverY + 2,
      arenaMinX: this.innerMinX,
      arenaMaxX: this.innerMaxX,
    });

    let vy = 0;
    if (out.vertical === 'hover') vy = (this.hoverY - this.y) * 5;
    else if (out.vertical === 'slam') vy = 900;
    else if (out.vertical === 'rise') vy = -220;
    this.body.setVelocity(out.vx, vy);

    const spawns: BossSpawn[] = [];
    if (out.event?.type === 'boulders') for (const x of out.event.xs) spawns.push({ kind: 'boulder', x });
    if (out.event?.type === 'landed') shake(this.scene, 250, 0.012);

    const state = this.brain.state;
    const changed = state !== this.lastState;
    this.lastState = state;
    this.render(state);
    return { entered: changed && state === 'stunned' ? 'vulnerable' : changed && state === 'defeated' ? 'defeated' : null, spawns };
  }

  private showMarkers(xs: number[]): void {
    while (this.markers.length < xs.length) this.markers.push(this.scene.add.image(0, 0, TextureKeys.BoulderMark).setDepth(3));
    this.markers.forEach((m, i) => {
      const x = xs[i];
      m.setVisible(x !== undefined);
      if (x !== undefined) m.setPosition(x, this.startY - 4).setAlpha(0.6 + Math.sin(this.scene.time.now / 80) * 0.4);
    });
  }

  private render(state: SentinelState): void {
    this.showMarkers(this.brain.markers);
    this.showWarning(state === 'dropTelegraph' || state === 'slamTelegraph');
    const angry = state === 'dropTelegraph' || state === 'slamTelegraph' || state === 'slam';
    const down = state === 'stunned' || state === 'hurt' || state === 'defeated';
    this.setTexture(down ? TextureKeys.SentinelStunned : angry ? TextureKeys.SentinelAngry : TextureKeys.SentinelIdle);
    const t = this.scene.time.now;
    if (state === 'slamTelegraph') this.setTint(Math.floor(t / 90) % 2 === 0 ? 0xff8a80 : 0xffffff);
    else if (state === 'hurt') this.setTint(Math.floor(t / 70) % 2 === 0 ? 0xffffff : 0xff5252);
    else this.clearTint();
    this.setAngle(state === 'stunned' ? Math.sin(t / 100) * 5 : state === 'hover' ? Math.sin(t / 400) * 3 : 0);
  }

  override playDefeat(onDone: () => void): void {
    this.showMarkers([]);
    super.playDefeat(onDone);
  }
}
