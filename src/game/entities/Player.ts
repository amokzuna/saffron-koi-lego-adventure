import Phaser from 'phaser';
import { PLAYER_BODY_HEIGHT, PLAYER_BODY_WIDTH } from '../config/constants';
import { GAMEPLAY } from '../config/gameplay';
import type { MovementConfig } from '../config/movement';
import { AnimationKeys, TextureKeys } from '../config/textureKeys';
import type { FrameInput } from '../input/InputState';
import { BOOST_DURATION_MS, BOOST_SPEED } from '../systems/environment';
import { initialJumpState, nextHorizontalVelocity, updateJump, type JumpState } from '../systems/movement';
import { HERO_HEIGHT, HERO_WIDTH } from '../../features/character/heroRenderer';
import { HERO_TEXTURE_SCALE } from '../systems/textures';

const LANDING_DUST_SPEED = 520;
const BODY_WIDTH = PLAYER_BODY_WIDTH;
const BODY_HEIGHT = PLAYER_BODY_HEIGHT;

export class Player extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;
  private jumpState: JumpState = initialJumpState();
  private frozen = false;
  /** While the clock is below this, horizontal input is ignored (knockback). */
  private controlLockedUntilMs = 0;
  private clockMs = 0;
  /** Velocity from the player's own control; external pushes (wind) are added on top, not accumulated. */
  private controlVx = 0;
  private boostUntilMs = 0;
  private boostDirection: -1 | 1 = 1;
  /** True on the frame a jump started (for sound/feedback). */
  justJumped = false;
  /** True on the frame the player landed after a fall faster than LANDING_DUST_SPEED. */
  justLandedHard = false;
  private wasOnGround = true;
  private lastFallSpeed = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TextureKeys.HeroIdle);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    // Origin at the feet so spawn/respawn positions are "standing on" coordinates.
    this.setOrigin(0.5, 1);
    // Textures are rendered at HERO_TEXTURE_SCALE; body sizes/offsets are in texture pixels and scale with the sprite.
    const s = HERO_TEXTURE_SCALE;
    this.setScale(1 / s);
    this.body.setSize(BODY_WIDTH * s, BODY_HEIGHT * s);
    this.body.setOffset(((HERO_WIDTH - BODY_WIDTH) / 2) * s, (HERO_HEIGHT - BODY_HEIGHT) * s);
    this.body.setCollideWorldBounds(true);
    this.setDepth(10);
  }

  get onGround(): boolean {
    return this.body.blocked.down || this.body.touching.down;
  }

  /** Feet position at the previous physics step (used for stomp detection). */
  get previousBottom(): number {
    return this.body.prev.y + this.body.height;
  }

  private get controlLocked(): boolean {
    return this.clockMs < this.controlLockedUntilMs;
  }

  /**
   * Advances movement for one frame using the current (possibly power-up- or surface-modified) config.
   * `externalVx` is an environmental push (wind) added on top of the player's own control velocity.
   */
  step(input: FrameInput, deltaMs: number, clockMs: number, baseConfig: MovementConfig, externalVx = 0): void {
    this.clockMs = clockMs;
    const onGround = this.onGround;
    this.justJumped = false;
    this.justLandedHard = onGround && !this.wasOnGround && this.lastFallSpeed > LANDING_DUST_SPEED;
    this.wasOnGround = onGround;
    this.lastFallSpeed = this.body.velocity.y;
    const config = this.boosting ? this.boostConfig(baseConfig) : baseConfig;

    // Walls stop the player's own momentum (Arcade zeroes the body velocity, not ours).
    if ((this.body.blocked.left && this.controlVx < 0) || (this.body.blocked.right && this.controlVx > 0)) this.controlVx = 0;

    if (this.frozen || this.controlLocked) {
      if (this.frozen) this.controlVx = nextHorizontalVelocity(this.controlVx, 0, onGround, deltaMs, config);
      else this.controlVx = this.body.velocity.x;
      if (this.frozen) this.body.setVelocityX(this.controlVx);
      this.capFall(config);
      this.updateAnimation();
      return;
    }

    const direction = this.boosting && input.direction === 0 ? this.boostDirection : input.direction;
    this.controlVx = nextHorizontalVelocity(this.controlVx, direction, onGround, deltaMs, config);
    this.body.setVelocityX(this.controlVx + externalVx);

    const { state, action } = updateJump(
      this.jumpState,
      { jumpPressed: input.jumpPressed, jumpHeld: input.jumpHeld, onGround, verticalVelocity: this.body.velocity.y, deltaMs },
      config,
    );
    this.jumpState = state;
    if (action === 'jump') {
      this.body.setVelocityY(-config.jumpVelocity);
      this.justJumped = true;
    }
    else if (action === 'cut') this.body.setVelocityY(this.body.velocity.y * config.jumpCutMultiplier);

    this.capFall(config);
    if (input.direction !== 0) this.setFlipX(input.direction < 0);
    this.updateAnimation();
  }

  private get boosting(): boolean {
    return this.clockMs < this.boostUntilMs;
  }

  private boostConfig(config: MovementConfig): MovementConfig {
    return { ...config, maxRunSpeed: Math.max(config.maxRunSpeed, BOOST_SPEED), groundDeceleration: config.groundDeceleration * 0.2 };
  }

  /** Ice slide pad: launch in `direction` and keep a raised speed cap briefly. */
  boost(direction: -1 | 1): void {
    this.boostDirection = direction;
    this.boostUntilMs = this.clockMs + BOOST_DURATION_MS;
    this.controlVx = direction * BOOST_SPEED;
    this.body.setVelocityX(this.controlVx);
    this.setFlipX(direction < 0);
  }

  private capFall(config: MovementConfig): void {
    if (this.body.velocity.y > config.maxFallSpeed) this.body.setVelocityY(config.maxFallSpeed);
  }

  private updateAnimation(): void {
    if (this.controlLocked) {
      this.anims.stop();
      this.setTexture(TextureKeys.HeroHurt);
    } else if (!this.onGround) {
      this.anims.stop();
      this.setTexture(this.body.velocity.y < 0 ? TextureKeys.HeroJump : TextureKeys.HeroFall);
    } else if (Math.abs(this.body.velocity.x) > 20) {
      this.anims.play(AnimationKeys.HeroRun, true);
    } else {
      this.anims.stop();
      this.setTexture(TextureKeys.HeroIdle);
    }
  }

  /** Push the player away from a damage source and briefly remove horizontal control. */
  knockback(direction: -1 | 1): void {
    this.body.setVelocity(direction * GAMEPLAY.knockbackVelocityX, -GAMEPLAY.knockbackVelocityY);
    this.controlVx = direction * GAMEPLAY.knockbackVelocityX;
    this.boostUntilMs = 0;
    this.controlLockedUntilMs = this.clockMs + GAMEPLAY.knockbackControlLockMs;
    this.jumpState = initialJumpState();
  }

  /** Bounce after stomping an enemy; holding jump bounces higher. The jump can still be cut by releasing. */
  bounce(jumpHeld: boolean): void {
    this.body.setVelocityY(-(jumpHeld ? GAMEPLAY.stompBounceHeldVelocity : GAMEPLAY.stompBounceVelocity));
    this.jumpState = { coyoteMs: 0, bufferMs: 0, rising: jumpHeld };
  }

  /** Stops responding to input (used on level completion and game over). */
  freeze(): void {
    this.frozen = true;
  }

  unfreeze(): void {
    this.frozen = false;
  }

  respawnAt(x: number, y: number): void {
    this.body.reset(x, y);
    this.jumpState = initialJumpState();
    this.controlLockedUntilMs = 0;
    this.controlVx = 0;
    this.boostUntilMs = 0;
    this.setFlipX(false);
  }
}
