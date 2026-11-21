import { burst, flash, shake } from '../systems/fx';
import { soundDuration, type SoundId } from '../../features/audio/sounds';
import Phaser from 'phaser';
import type { GameBridge } from '../bridge/GameBridge';
import { FALL_RESPAWN_MARGIN, GAME_HEIGHT, GAME_WIDTH, HUD_TIMER_INTERVAL_MS, TILE_SIZE } from '../config/constants';
import { GAMEPLAY } from '../config/gameplay';
import { MOVEMENT } from '../config/movement';
import { TextureKeys } from '../config/textureKeys';
import { THEMES, themedKey } from '../config/themes';
import { createBoss, type BossBase, type BossSpawn } from '../entities/bosses';
import { FireFeature } from '../features/FireFeatures';
import { IceFeature } from '../features/IceFeatures';
import type { FeatureContext, LevelFeature } from '../features/LevelFeature';
import { SinkingSandFeature } from '../features/SinkingSand';
import { SwitchesAndDoorsFeature } from '../features/SwitchesAndDoors';
import { WindFeature } from '../features/Wind';
import { applySurface, type SurfaceKind } from '../systems/environment';
import { CrumblePlank } from '../entities/CrumblePlank';
import { MovingHazard } from '../entities/MovingHazard';
import { createEnemy, type Enemy } from '../entities/Enemy';
import { MovingPlatform } from '../entities/MovingPlatform';
import { Player } from '../entities/Player';
import { InputCombiner, type ControlState, type FrameInput, type VirtualControls } from '../input/InputState';
import {
  buildCheckpoints,
  buildCollectibles,
  buildDecorations,
  buildGoal,
  buildHazards,
  buildPowerUps,
  buildSolids,
  tileToFeet,
  type CollectibleSprite,
} from '../levels/buildLevel';
import type { LevelDefinition, PowerUpPlacement } from '../levels/types';
import { isStomp, knockbackDirection } from '../systems/combat';
import { floatText } from '../systems/effects';
import { LevelSession } from '../systems/LevelSession';
import { POWER_UPS } from '../systems/powerUps';
import { DarknessOverlay, type LightSource } from '../systems/DarknessOverlay';
import { LIGHT_SMALL_RADIUS } from '../systems/textures';
import { SceneKeys } from './sceneKeys';

export interface LevelSceneServices {
  bridge: GameBridge;
  controls: VirtualControls;
  level: LevelDefinition;
}

type KeyMap = Record<'left' | 'a' | 'right' | 'd' | 'up' | 'w' | 'space', Phaser.Input.Keyboard.Key>;
type ArcadeObject = Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile;
type BossFight = 'none' | 'waiting' | 'active' | 'won';

/** After any stomp on the boss, ignore boss contact briefly so the bounce can't turn into a side hit. */
const BOSS_CONTACT_COOLDOWN_MS = 350;

const NO_INPUT: FrameInput = { direction: 0, jumpHeld: false, jumpPressed: false };

/**
 * Runs a single level from a LevelDefinition. Gameplay rules live in LevelSession and the
 * systems/ helpers; this scene wires them to Phaser objects. Restarting the scene fully resets state.
 */
export class LevelScene extends Phaser.Scene {
  private session!: LevelSession;
  private player!: Player;
  private enemies!: Phaser.GameObjects.Group;
  private shieldBubble!: Phaser.GameObjects.Image;
  private keys!: KeyMap;
  private readonly combiner = new InputCombiner();
  private lastInput: FrameInput = NO_INPUT;
  private hills!: Phaser.GameObjects.TileSprite;
  private clouds!: Phaser.GameObjects.TileSprite;
  private lastHudEmitMs = 0;
  private movingPlatforms: MovingPlatform[] = [];
  private goal!: Phaser.Physics.Arcade.Image;
  private boss: BossBase | null = null;
  private shockwaves!: Phaser.GameObjects.Group;
  private boulders!: Phaser.GameObjects.Group;
  private eruptions!: Phaser.GameObjects.Group;
  private features: LevelFeature[] = [];
  /** Surface the player stood on during the last physics step (set by the solids collider). */
  private groundSurface: SurfaceKind = 'normal';
  private crumblePlanks: CrumblePlank[] = [];
  private movingHazards: MovingHazard[] = [];
  private darkness: DarknessOverlay | null = null;
  private staticLights: LightSource[] = [];
  private bossFight: BossFight = 'none';
  private bossContactCooldownUntil = 0;
  private gates!: Phaser.Physics.Arcade.StaticGroup;
  private gateVisuals: Phaser.GameObjects.TileSprite[] = [];

  constructor(private readonly services: LevelSceneServices) {
    super(SceneKeys.Level);
  }

  private get level(): LevelDefinition {
    return this.services.level;
  }

  create(): void {
    this.session = new LevelSession(this.level);
    this.lastHudEmitMs = 0;
    this.lastInput = NO_INPUT;
    this.combiner.reset();
    this.services.controls.releaseAll();

    const widthPx = this.level.width * TILE_SIZE;
    const heightPx = this.level.height * TILE_SIZE;

    this.createBackground();
    buildDecorations(this, this.level.decorations);
    const solids = buildSolids(this, this.level.solids, this.level.theme);
    this.movingPlatforms = this.level.movingPlatforms.map((placement) => new MovingPlatform(this, placement));
    this.crumblePlanks = (this.level.crumbling ?? []).flatMap((c) => Array.from({ length: c.width }, (_, i) => new CrumblePlank(this, c.x + i, c.y)));
    this.movingHazards = (this.level.movingHazards ?? []).map((placement) => new MovingHazard(this, placement));
    const hazards = buildHazards(this, this.level.hazards);
    const checkpoints = buildCheckpoints(this, this.level.checkpoints);
    const collectibles = buildCollectibles(this, this.level.collectibles);
    const powerUps = buildPowerUps(this, this.level.powerUps);
    this.goal = buildGoal(this, this.level);
    this.gates = this.physics.add.staticGroup();
    this.gateVisuals = [];

    const spawn = tileToFeet(this.level.spawn);
    this.player = new Player(this, spawn.x, spawn.y);
    this.shieldBubble = this.add.image(spawn.x, spawn.y, TextureKeys.ShieldBubble).setDepth(11).setVisible(false);

    // Plain (non-physics) group: keeps each enemy's own body settings and drops destroyed enemies automatically.
    this.enemies = this.add.group(this.level.enemies.map((placement) => createEnemy(this, placement)));

    // Side walls only: the bottom is open so pits are fatal.
    this.physics.world.setBounds(0, -heightPx, widthPx, heightPx * 3, true, true, false, false);
    this.physics.add.collider(this.player, solids, (_p, zone) => {
      const z = zone as Phaser.GameObjects.Zone;
      if (z.getData('surface') === 'ice' && this.player.body.touching.down && this.player.body.bottom <= z.y + 2) this.groundSurface = 'ice';
    });
    this.physics.add.collider(this.player, this.movingPlatforms);
    this.physics.add.collider(this.player, this.crumblePlanks, (_p, plank) => this.onCrumbleContact(plank as CrumblePlank));
    this.physics.add.overlap(this.player, this.movingHazards, (_p, hazard) => this.hurtPlayer((hazard as MovingHazard).x));
    this.physics.add.collider(this.player, this.gates);
    this.physics.add.collider(this.enemies, solids, undefined, (enemy) => (enemy as Enemy).body.allowGravity);
    this.physics.add.overlap(this.player, collectibles, (_p, item) => this.onCollect(item as CollectibleSprite));
    this.physics.add.overlap(this.player, powerUps, (_p, item) => this.onPowerUp(item as Phaser.Physics.Arcade.Image));
    this.physics.add.overlap(this.player, checkpoints, (_p, flag) => this.onCheckpoint(flag as Phaser.Physics.Arcade.Image));
    this.physics.add.overlap(this.player, hazards, (_p, zone) => this.onHazard(zone as ArcadeObject));
    this.physics.add.overlap(this.player, this.enemies, (_p, enemy) => this.onEnemyContact(enemy as Enemy));
    this.physics.add.overlap(this.player, this.goal, () => this.onReachGoal());
    this.createBoss(solids);
    this.createFeatures(solids);
    this.createDarkness();

    const camera = this.cameras.main;
    camera.setBounds(0, 0, widthPx, heightPx);
    camera.startFollow(this.player, true, 0.12, 0.12, 0, 40);
    camera.setDeadzone(120, 80);
    camera.setRoundPixels(true);

    const keyboard = this.input.keyboard!;
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = keyboard.addKeys({ left: K.LEFT, a: K.A, right: K.RIGHT, d: K.D, up: K.UP, w: K.W, space: K.SPACE }) as KeyMap;
    keyboard.enableGlobalCapture();

    this.bindCommands();
    this.emitHud();
    this.services.bridge.events.emit('ready', undefined);
  }

  private createBoss(solids: Phaser.Physics.Arcade.StaticGroup): void {
    this.boss = null;
    this.bossFight = 'none';
    this.shockwaves = this.add.group();
    this.boulders = this.add.group();
    this.eruptions = this.add.group();
    this.bossContactCooldownUntil = 0;
    if (!this.level.boss) return;
    this.boss = createBoss(this, this.level.boss);
    this.bossFight = 'waiting';
    this.physics.add.collider(this.boss, solids);
    this.physics.add.collider(this.boss, this.gates);
    this.physics.add.overlap(this.player, this.boss, () => this.onBossContact());
    this.physics.add.overlap(this.player, this.shockwaves, (_p, wave) => this.hurtPlayer((wave as Phaser.Physics.Arcade.Image).x));
    this.physics.add.overlap(this.player, this.boulders, (_p, b) => this.hurtPlayer((b as Phaser.Physics.Arcade.Image).x));
    this.physics.add.overlap(this.player, this.eruptions, (_p, e) => {
      const zone = e as Phaser.GameObjects.Zone;
      this.hurtPlayer(zone.x + zone.width / 2);
    });
    this.physics.add.collider(this.boulders, solids, (b) => this.shatterBoulder(b as Phaser.Physics.Arcade.Image));
    // The goal only appears (and only counts, see onReachGoal) once the boss is defeated.
    this.goal.setVisible(false);
  }

  private startBossFight(): void {
    const boss = this.boss!;
    const placement = boss.placement;
    this.bossFight = 'active';

    const x = placement.arenaMinX * TILE_SIZE;
    const height = (placement.y + 1) * TILE_SIZE;
    const gateZone = this.add.zone(x, 0, TILE_SIZE, height).setOrigin(0);
    this.gates.add(gateZone);
    this.gates.refresh();
    const visual = this.add.tileSprite(x, height, TILE_SIZE, height, TextureKeys.Gate).setOrigin(0, 1).setDepth(2).setScale(1, 0);
    this.tweens.add({ targets: visual, scaleY: 1, duration: 500, ease: 'Back.easeOut' });
    this.gateVisuals.push(visual);

    const widthPx = (placement.arenaMaxX - placement.arenaMinX + 1) * TILE_SIZE;
    this.cameras.main.setBounds(x, 0, widthPx, this.level.height * TILE_SIZE);
    shake(this, 300, 0.006);
    floatText(this, boss.x, boss.y - 80, placement.name.toUpperCase(), '#ffe680');
    boss.activate();
    this.emitHud();
  }

  /** Continuing after a game over restarts the boss encounter from the beginning. */
  private resetBossFight(): void {
    if (!this.boss || this.bossFight !== 'active') return;
    this.boss.resetFight();
    this.bossFight = 'waiting';
    this.clearBossHazards();
    this.gates.clear(true, true);
    this.gateVisuals.forEach((v) => v.destroy());
    this.gateVisuals = [];
    this.cameras.main.setBounds(0, 0, this.level.width * TILE_SIZE, this.level.height * TILE_SIZE);
  }

  private onBossContact(): void {
    const boss = this.boss!;
    if (!this.session.isPlaying || this.bossFight !== 'active' || this.session.clockMs < this.bossContactCooldownUntil) return;
    const stomped = isStomp({
      playerPreviousBottom: this.player.previousBottom,
      playerVelocityY: this.player.body.velocity.y,
      enemyTop: boss.body.top,
      tolerancePx: GAMEPLAY.stompTolerancePx,
    });
    if (stomped) {
      this.bossContactCooldownUntil = this.session.clockMs + BOSS_CONTACT_COOLDOWN_MS;
      this.player.bounce(this.lastInput.jumpHeld);
      const damaged = boss.stomp() === 'damaged';
      this.playSound(damaged ? 'bossHit' : 'stomp');
      if (damaged) {
        burst(this, boss.x, boss.y - boss.displayHeight / 2, 0xffe680, 16);
        shake(this, 200, 0.01);
        floatText(this, boss.x, boss.y - boss.displayHeight - 10, boss.hp > 0 ? 'HIT!' : 'DEFEATED!', '#ffe680');
        this.emitHud();
      }
      return;
    }
    if (boss.touchHurtsPlayer) this.hurtPlayer(boss.x);
  }

  private updateBoss(delta: number): void {
    const boss = this.boss;
    if (!boss) return;
    if (this.bossFight === 'waiting' && this.player.x > boss.placement.triggerX * TILE_SIZE) this.startBossFight();
    if (this.bossFight !== 'active') return;

    const result = boss.tick(delta, this.player.x);
    for (const spawn of result.spawns) this.spawnBossHazard(spawn);
    if (result.spawns.some((sp) => sp.kind === 'eruption')) this.playSound('boom');
    if (result.entered === 'vulnerable') {
      this.playSound('boom');
      shake(this, 250, 0.012);
      floatText(this, boss.x, boss.y - boss.displayHeight - 10, boss.vulnerableText, '#9fe3ff');
    } else if (result.entered === 'defeated') {
      this.bossFight = 'won';
      this.clearBossHazards();
      boss.playDefeat(() => this.revealGoal());
      this.emitHud();
    }

    // Shockwaves dissipate at the arena walls.
    for (const wave of this.shockwaves.getChildren() as Phaser.Physics.Arcade.Image[]) {
      if (wave.x < boss.innerMinX + 8 || wave.x > boss.innerMaxX - 8) wave.destroy();
    }
  }

  private spawnBossHazard(spawn: BossSpawn): void {
    if (spawn.kind === 'shockwave') {
      const wave = this.physics.add.image(spawn.x, spawn.y, TextureKeys.Shockwave).setOrigin(0.5, 1).setDepth(6);
      wave.body.setAllowGravity(false);
      wave.body.setSize(20, 16).setOffset(4, 6);
      wave.setVelocityX(spawn.speed).setFlipX(spawn.speed < 0);
      this.shockwaves.add(wave);
    } else if (spawn.kind === 'boulder') {
      const boulder = this.physics.add.image(spawn.x, this.cameras.main.scrollY - 40, TextureKeys.Boulder).setDepth(8);
      boulder.body.setCircle(15, 3, 3);
      boulder.body.setMaxVelocityY(700);
      this.boulders.add(boulder);
    } else {
      const width = spawn.x1 - spawn.x0;
      const visual = this.add.tileSprite(spawn.x0, spawn.y, width, 48, TextureKeys.Eruption).setOrigin(0, 1).setDepth(7).setScale(1, 0.2);
      this.tweens.add({ targets: visual, scaleY: 1, duration: 120, ease: 'Back.easeOut' });
      const zone = this.add.zone(spawn.x0 + 6, spawn.y - 40, width - 12, 40).setOrigin(0);
      this.physics.add.existing(zone, true);
      this.eruptions.add(zone);
      this.time.delayedCall(spawn.durationMs, () => {
        zone.destroy();
        this.tweens.add({ targets: visual, alpha: 0, duration: 200, onComplete: () => visual.destroy() });
      });
    }
  }

  private shatterBoulder(boulder: Phaser.Physics.Arcade.Image): void {
    burst(this, boulder.x, boulder.y, 0xb8a68a, 10);
    this.playSound('boom');
    shake(this, 80, 0.004);
    boulder.destroy();
  }

  private clearBossHazards(): void {
    this.shockwaves.clear(true, true);
    this.boulders.clear(true, true);
    this.eruptions.clear(true, true);
  }

  private createFeatures(solids: Phaser.Physics.Arcade.StaticGroup): void {
    const ctx: FeatureContext = {
      scene: this,
      level: this.level,
      player: this.player,
      session: this.session,
      solids,
      hurtPlayer: (x) => this.hurtPlayer(x),
      fatal: () => this.onFall(),
      floatText: (x, y, text, color) => floatText(this, x, y, text, color),
      sound: (id) => this.playSound(id),
    };
    const l = this.level;
    this.features = [];
    if (l.sinkingPlatforms?.length) this.features.push(new SinkingSandFeature(ctx));
    if (l.switches?.length || l.doors?.length || l.secrets?.length) this.features.push(new SwitchesAndDoorsFeature(ctx));
    if (l.windZones?.length) this.features.push(new WindFeature(ctx));
    if (l.boostPads?.length || l.icicles?.length) this.features.push(new IceFeature(ctx));
    if (l.flameJets?.length || l.timedPlatforms?.length) this.features.push(new FireFeature(ctx));
  }

  // ---------- World 2 mechanics ----------

  private onCrumbleContact(plank: CrumblePlank): void {
    // Only standing on top starts the crumble (not bumping it from the side or below).
    if (this.player.body.touching.down && this.player.body.bottom <= plank.body.top + 2) plank.tile.touch();
  }

  private updateCrumbles(delta: number): void {
    const playerRect = this.player.getBounds();
    for (const plank of this.crumblePlanks) {
      plank.step(delta, Phaser.Geom.Intersects.RectangleToRectangle(playerRect, plank.rect));
    }
  }

  private createDarkness(): void {
    this.darkness = null;
    this.staticLights = [];
    if (!this.level.darkness) return;
    this.darkness = new DarknessOverlay(this, this.level.darkness);
    // Fixed light sources: glow mushrooms light the route; checkpoints, hazards, and the goal are always lit.
    for (const d of this.level.decorations) {
      if (d.kind === 'glowMushroom') this.staticLights.push({ ...tileToFeet(d), radius: LIGHT_SMALL_RADIUS });
      if (d.kind === 'sign') {
        const feet = tileToFeet(d);
        this.staticLights.push({ x: feet.x, y: feet.y - 45, radius: 120 });
      }
    }
    for (const c of this.level.checkpoints) {
      const feet = tileToFeet(c);
      this.staticLights.push({ x: feet.x, y: feet.y - 30, radius: 110 });
    }
    for (const h of this.level.hazards) {
      for (let x = h.x; x < h.x + h.width; x++) this.staticLights.push({ ...tileToFeet({ x, y: h.y }), radius: 50 });
    }
    const goal = tileToFeet(this.level.goal);
    this.staticLights.push({ x: goal.x, y: goal.y - 60, radius: 140 });
  }

  private renderDarkness(): void {
    if (!this.darkness) return;
    const lights: LightSource[] = [
      { x: this.player.x, y: this.player.y - 24, radius: this.darkness.playerLightRadius },
      ...this.staticLights,
    ];
    // Enemies and moving hazards carry a faint glow so threats are never invisible.
    for (const enemy of this.enemies.getChildren() as Enemy[]) lights.push({ x: enemy.x, y: enemy.y - 12, radius: 55 });
    for (const hazard of this.movingHazards) lights.push({ x: hazard.x, y: hazard.y, radius: 60 });
    for (const feature of this.features) if (feature.lights) lights.push(...feature.lights());
    this.darkness.render(lights);
  }

  private revealGoal(): void {
    // Animate a separate image so the goal's static physics body stays in place.
    const goal = this.goal;
    const drop = this.add.image(goal.x, goal.y - 200, goal.texture.key).setOrigin(0.5, 1).setDepth(goal.depth);
    this.tweens.add({
      targets: drop,
      y: goal.y,
      duration: 700,
      ease: 'Bounce.easeOut',
      onComplete: () => {
        drop.destroy();
        goal.setVisible(true);
      },
    });
    floatText(this, goal.x, goal.y - 170, 'THE WAY IS OPEN!', '#ffe680');
  }

  private createBackground(): void {
    const theme = this.level.theme;
    this.cameras.main.setBackgroundColor(THEMES[theme].cameraBackground);
    this.add.image(0, 0, themedKey(TextureKeys.Sky, theme)).setOrigin(0).setScrollFactor(0).setDepth(-30);
    const topY = THEMES[theme].top === 'stalactites' ? 0 : 20;
    this.clouds = this.add.tileSprite(0, topY, GAME_WIDTH, 160, themedKey(TextureKeys.Clouds, theme)).setOrigin(0).setScrollFactor(0).setDepth(-20);
    this.hills = this.add
      .tileSprite(0, GAME_HEIGHT - 260, GAME_WIDTH, 260, themedKey(TextureKeys.Hills, theme))
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(-10);
  }

  private bindCommands(): void {
    const { commands } = this.services.bridge;
    const unsubscribe = [
      commands.on('pause', () => this.pauseLevel()),
      commands.on('resume', () => this.resumeLevel()),
      commands.on('restart', () => this.restartLevel()),
      commands.on('continueFromCheckpoint', () => this.continueFromCheckpoint()),
    ];
    const off = () => unsubscribe.forEach((fn) => fn());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, off);
    this.events.once(Phaser.Scenes.Events.DESTROY, off);
  }

  // ---------- Commands from React ----------

  private pauseLevel(): void {
    if (!this.scene.isActive()) return;
    this.releaseInput();
    // Let Space/arrow keys operate the React pause menu while paused.
    this.input.keyboard?.disableGlobalCapture();
    this.scene.pause();
  }

  private resumeLevel(): void {
    if (!this.scene.isPaused()) return;
    this.combiner.reset();
    this.input.keyboard?.resetKeys();
    this.input.keyboard?.enableGlobalCapture();
    this.scene.resume();
  }

  private restartLevel(): void {
    this.input.keyboard?.resetKeys();
    this.scene.restart();
  }

  private continueFromCheckpoint(): void {
    if (this.session.state !== 'gameOver') return;
    this.resetBossFight();
    const feet = tileToFeet(this.session.continueFromCheckpoint());
    this.player.respawnAt(feet.x, feet.y);
    this.player.setVisible(true).setAngle(0);
    this.player.unfreeze();
    this.combiner.reset();
    this.input.keyboard?.resetKeys();
    this.input.keyboard?.enableGlobalCapture();
    this.physics.resume();
    flash(this, 250, 255, 255, 255);
    this.emitHud();
    this.services.bridge.events.emit('ready', undefined);
  }

  // ---------- Frame update ----------

  override update(_time: number, rawDelta: number): void {
    // Clamp large frame gaps (tab switches, hitches) so movement stays stable.
    const delta = Math.min(rawDelta, 50);
    const session = this.session;
    const expired = session.tick(delta);
    for (const platform of this.movingPlatforms) platform.tick(session.clockMs, delta);
    for (const hazard of this.movingHazards) hazard.tick(session.clockMs, delta);
    this.updateCrumbles(delta);
    for (const feature of this.features) feature.update(session.clockMs, delta);
    const surface = this.groundSurface;
    this.groundSurface = 'normal';

    if (session.isPlaying) {
      this.lastInput = this.combiner.next(this.readKeyboard(), this.services.controls.state);
      const push = this.features.reduce((sum, f) => sum + (f.playerPush?.() ?? 0), 0);
      const config = applySurface(session.movementConfig(MOVEMENT), this.player.onGround ? surface : 'normal');
      this.player.step(this.lastInput, delta, session.clockMs, config, push);
      if (this.player.justJumped) this.playSound('jump');
      if (this.player.justLandedHard) burst(this, this.player.x, this.player.y, 0xd8cfc0, 6);
      for (const enemy of this.enemies.getChildren() as Enemy[]) enemy.tick(session.clockMs, delta);
      this.updateBoss(delta);
    } else if (session.state === 'complete') {
      this.player.step(NO_INPUT, delta, session.clockMs, MOVEMENT);
    }

    this.updateVisuals();
    this.renderDarkness();

    if (session.isPlaying && this.player.y > this.level.height * TILE_SIZE + FALL_RESPAWN_MARGIN) this.onFall();
    if (expired.length > 0 || session.elapsedMs - this.lastHudEmitMs >= HUD_TIMER_INTERVAL_MS) this.emitHud();
  }

  private updateVisuals(): void {
    const { session, player } = this;
    const camX = this.cameras.main.scrollX;
    this.hills.tilePositionX = camX * 0.3;
    this.clouds.tilePositionX = camX * 0.12;

    // Blink while invulnerable so the player knows hits are being ignored.
    const blinking = session.isPlaying && session.isInvulnerable();
    player.setAlpha(blinking && Math.floor(session.clockMs / 90) % 2 === 0 ? 0.35 : 1);

    const shield = session.powerUps.list(session.clockMs).find((p) => p.kind === 'shield');
    this.shieldBubble.setVisible(Boolean(shield) && session.isPlaying);
    if (shield) {
      this.shieldBubble.setPosition(player.x, player.y - player.displayHeight / 2);
      // Flicker during the final two seconds as a warning.
      this.shieldBubble.setAlpha(shield.remainingMs < 2000 && Math.floor(session.clockMs / 120) % 2 === 0 ? 0.3 : 1);
    }
  }

  private readKeyboard(): ControlState {
    const k = this.keys;
    return {
      left: k.left.isDown || k.a.isDown,
      right: k.right.isDown || k.d.isDown,
      jump: k.space.isDown || k.up.isDown || k.w.isDown,
    };
  }

  private releaseInput(): void {
    this.services.controls.releaseAll();
    this.input.keyboard?.resetKeys();
  }

  // ---------- Gameplay events ----------

  private onCollect(item: CollectibleSprite): void {
    const placement = item.getData('placement');
    if (!this.session.isPlaying || !this.session.collectibles.collect(placement.id)) return;

    item.disableBody(false, false);
    this.tweens.killTweensOf(item);
    this.tweens.add({
      targets: item,
      y: item.y - 28,
      alpha: 0,
      scale: 1.4,
      duration: 220,
      ease: 'Quad.easeOut',
      onComplete: () => item.destroy(),
    });
    if (placement.kind === 'brick') floatText(this, item.x, item.y - 12, 'BUILD BRICK!', '#9fd0ff');
    burst(this, item.x, item.y, placement.kind === 'brick' ? 0x6aa8ff : 0xffcc33, placement.kind === 'brick' ? 14 : 6);
    this.playSound(placement.kind === 'brick' ? 'brick' : 'coin');
    this.emitHud();
  }

  private onPowerUp(item: Phaser.Physics.Arcade.Image): void {
    const placement = item.getData('placement') as PowerUpPlacement;
    const outcome = this.session.collectPowerUp(placement.id, placement.kind);
    if (!outcome) return;

    item.disableBody(false, false);
    this.tweens.killTweensOf(item);
    this.tweens.add({ targets: item, scale: 1.8, alpha: 0, duration: 250, onComplete: () => item.destroy() });

    const def = POWER_UPS[placement.kind];
    const text = def.type === 'instant' && outcome.healed === 0 ? 'HEARTS FULL' : def.pickupText;
    floatText(this, this.player.x, this.player.y - 50, text, '#ffe680');
    this.playSound('powerUp');
    this.emitHud();
  }

  private onCheckpoint(flag: Phaser.Physics.Arcade.Image): void {
    const id = flag.getData('checkpointId') as string;
    if (!this.session.isPlaying || !this.session.checkpoints.activate(id)) return;
    flag.setTexture(TextureKeys.CheckpointActive);
    this.tweens.add({ targets: flag, scaleX: 1.2, scaleY: 1.2, duration: 120, yoyo: true });
    floatText(this, flag.x, flag.y - 70, 'CHECKPOINT', '#ffe680');
    this.playSound('checkpoint');
  }

  private onHazard(zone: ArcadeObject): void {
    const source = zone as Phaser.GameObjects.Zone;
    // Lava behaves like a pit; spikes hurt with knockback.
    if (source.getData('kind') === 'lava') {
      if (this.session.isPlaying) this.onFall();
      return;
    }
    this.hurtPlayer(source.x + source.width / 2);
  }

  private onEnemyContact(enemy: Enemy): void {
    if (!enemy.isAlive || !this.session.isPlaying) return;
    const stomped = isStomp({
      playerPreviousBottom: this.player.previousBottom,
      playerVelocityY: this.player.body.velocity.y,
      enemyTop: enemy.body.top,
      tolerancePx: GAMEPLAY.stompTolerancePx,
    });
    if (stomped) {
      enemy.defeat();
      burst(this, enemy.x, enemy.y - 10, 0xc9a0ff, 10);
      this.playSound('stomp');
      this.player.bounce(this.lastInput.jumpHeld);
      return;
    }
    this.hurtPlayer(enemy.x);
  }

  private hurtPlayer(sourceX: number): void {
    const outcome = this.session.hit();
    if (outcome === 'ignored') return;
    this.player.knockback(knockbackDirection(this.player.x, sourceX));

    if (outcome === 'shielded') {
      floatText(this, this.player.x, this.player.y - 50, 'BLOCKED!', '#9fe3ff');
      this.playSound('stomp');
    } else if (outcome === 'hurt') {
      shake(this, 150, 0.006);
      this.playSound('hurt');
    } else {
      this.onGameOver();
    }
    this.emitHud();
  }

  /** Pits and lava: the falling whistle replaces the generic hurt sound. */
  private onFall(): void {
    const outcome = this.session.fall();
    this.playSound('fall');
    if (outcome === 'dead') {
      this.player.setVisible(false);
      // Let the fall sound finish before the game-over jingle.
      this.onGameOver(soundDuration('fall') * 1000);
    } else {
      const feet = tileToFeet(this.session.checkpoints.respawnPoint);
      this.player.respawnAt(feet.x, feet.y);
      flash(this, 250, 255, 255, 255);
    }
    this.emitHud();
  }

  private onGameOver(jingleDelayMs = 0): void {
    this.player.freeze();
    this.player.setAlpha(1).setAngle(-12);
    this.releaseInput();
    this.input.keyboard?.disableGlobalCapture();
    this.physics.pause();
    shake(this, 250, 0.01);
    if (jingleDelayMs > 0) this.time.delayedCall(jingleDelayMs, () => this.playSound('gameOver'));
    else this.playSound('gameOver');
    this.services.bridge.events.emit('gameOver', { hasCheckpoint: this.session.checkpoints.activeCheckpointId !== null });
  }

  private onReachGoal(): void {
    if (this.boss && this.bossFight !== 'won') return;
    const result = this.session.complete();
    if (!result) return;
    this.player.freeze();
    this.releaseInput();
    this.input.keyboard?.disableGlobalCapture();
    this.emitHud();
    this.playSound('levelComplete');
    burst(this, this.player.x, this.player.y - 40, 0xffe680, 24);
    flash(this, 300, 255, 240, 160);
    this.time.delayedCall(700, () => this.services.bridge.events.emit('levelComplete', result));
  }

  private playSound(id: SoundId): void {
    this.services.bridge.events.emit('sound', id);
  }

  private emitHud(): void {
    this.lastHudEmitMs = this.session.elapsedMs;
    const boss =
      this.boss && this.bossFight === 'active'
        ? { name: this.boss.placement.name, hp: this.boss.hp, maxHp: this.boss.maxHp }
        : null;
    this.services.bridge.events.emit('hud', { ...this.session.hud(), boss });
  }
}
