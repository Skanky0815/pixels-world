import Phaser from 'phaser';
import './style.css';
import pixelSheetUrl from '../assets/pixel/pixel-sheet.png?url';
import { PIXEL_ANIMATIONS, pixelAnimation } from './pixel-animations';
import { ChaosScore, VASES, angerFor } from './chaos';
import { Vase } from './vase';
import { COUCH_SCRATCH, CouchScratching, type CouchDamageEvent } from './couch-scratching';
import { CURTAIN_SLIDE, CurtainSliding, type CurtainDamageEvent } from './curtain-sliding';
import { PLANT_NIBBLE, PlantNibbling, type PlantDamageEvent } from './plant-nibbling';

const WIDTH = 960;
const HEIGHT = 540;
const FLOOR_Y = 468;
const PIXEL_SCALE = 2;
const MAX_CHAOS_SCORE = VASES.reduce((sum, vase) => sum + vase.points, 0) + COUCH_SCRATCH.maxDamage * COUCH_SCRATCH.damageValue + CURTAIN_SLIDE.maxDamage * CURTAIN_SLIDE.damageValue + PLANT_NIBBLE.nibbleValue + PLANT_NIBBLE.tipValue;
const CURTAIN = new Phaser.Geom.Rectangle(744, 112, 112, 356);

class LivingRoom extends Phaser.Scene {
  private pixel!: Phaser.Physics.Arcade.Sprite;
  private pixelVisual!: Phaser.GameObjects.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private jump!: Phaser.Input.Keyboard.Key;
  private reset!: Phaser.Input.Keyboard.Key;
  private climbing = false;
  private climbHint!: Phaser.GameObjects.Text;
  private status!: Phaser.GameObjects.Text;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private grabBlockedUntil = 0;
  private mustLeaveCurtain = false;
  private readonly chaos = new ChaosScore();
  private vases: Vase[] = [];
  private fragments: Phaser.GameObjects.Rectangle[] = [];
  private scoreText!: Phaser.GameObjects.Text;
  private angerBar!: Phaser.GameObjects.Graphics;
  private readonly couchScratch = new CouchScratching();
  private scratchMarks!: Phaser.GameObjects.Graphics;
  private scratchingPaws!: Phaser.GameObjects.Graphics;
  private couchEvents = 0;
  private lastCouchDamage: CouchDamageEvent | null = null;
  private readonly curtainSlide = new CurtainSliding();
  private curtainMarks!: Phaser.GameObjects.Graphics;
  private curtainEvents = 0;
  private lastCurtainDamage: CurtainDamageEvent | null = null;
  private previousCurtainY: number | null = null;
  private previousCurtainSpeed = 0;
  private readonly plantNibble = new PlantNibbling();
  private plantGraphic!: Phaser.GameObjects.Graphics;
  private spilledSoil!: Phaser.GameObjects.Graphics;
  private plantEvents = 0;
  private lastPlantDamage: PlantDamageEvent | null = null;
  private wasAirborne = false;
  private landingUntil = 0;

  constructor() { super('LivingRoom'); }

  preload() {
    this.load.spritesheet('pixel', pixelSheetUrl, { frameWidth: 32, frameHeight: 32 });
  }

  create() {
    this.drawRoom();
    this.plantGraphic = this.add.graphics({ x: PLANT_NIBBLE.x, y: FLOOR_Y });
    this.spilledSoil = this.add.graphics();
    this.drawPlant();
    this.makeCatAnimations();
    this.scratchMarks = this.add.graphics();
    this.curtainMarks = this.add.graphics();
    this.scratchingPaws = this.add.graphics();
    this.makeVaseTexture();
    this.platforms = this.physics.add.staticGroup();
    // Keep rendered furniture and its collision surfaces in the same coordinates.
    const floor = this.addPlatform(0, FLOOR_Y, WIDTH, HEIGHT - FLOOR_Y);
    this.addPlatform(180, 370, 254, 28);
    this.addPlatform(518, 304, 146, 16);
    this.addPlatform(648, 224, 96, 16);
    this.addPlatform(856, 154, 80, 16);
    this.pixel = this.physics.add.sprite(110, FLOOR_Y - 16 * PIXEL_SCALE, 'pixel').setScale(PIXEL_SCALE);
    this.pixel.setBodySize(26, 26).setOffset(3, 6).setCollideWorldBounds(true);
    this.pixel.setMaxVelocity(260, 600).setVisible(false);
    this.pixelVisual = this.add.sprite(110, FLOOR_Y - 32, 'pixel', 0).setScale(PIXEL_SCALE);
    this.physics.add.collider(this.pixel, this.platforms);
    this.vases = VASES.map(config => {
      const vase = new Vase(this, config);
      this.physics.add.collider(vase, this.platforms, (_object, surface) => {
        if (surface === floor && vase.breakOnFloor()) this.breakVase(vase);
      });
      this.physics.add.collider(this.pixel, vase, () => {
        const body = vase.body as Phaser.Physics.Arcade.Body;
        if (body.touching.left || body.touching.right) {
          vase.push(this.pixel.x < vase.x ? 1 : -1);
        }
      });
      return vase;
    });
    const keyboard = this.input.keyboard;
    if (!keyboard) throw new Error('Pixel’s World requires keyboard input.');
    this.cursors = keyboard.createCursorKeys();
    this.jump = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.reset = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.climbHint = this.add.text(800, 90, '↑ KLETTERN\nLOSLASSEN: RUTSCHEN', { fontFamily: 'monospace', fontSize: '12px', color: '#fff1cf', backgroundColor: '#615047' }).setPadding(7, 5).setOrigin(0.5);
    this.status = this.add.text(26, 25, 'PIXEL · HOME ALONE', { fontFamily: 'monospace', fontSize: '12px', color: '#584637' });
    this.scoreText = this.add.text(26, 48, '', { fontFamily: 'monospace', fontSize: '12px', color: '#584637' });
    this.angerBar = this.add.graphics();
    this.updateScore();
    this.cameras.main.setBounds(0, 0, WIDTH, HEIGHT);
    if (import.meta.env.MODE === 'e2e') {
      void import('./test-observer').then(({ installTestObserver }) => {
        if (!this.scene.isActive()) return;
        const removeObserver = installTestObserver(() => {
          const body = this.pixel.body as Phaser.Physics.Arcade.Body;
          const camera = this.cameras.main;
          return {
            ready: this.scene.isActive(), scene: this.scene.key, frame: this.game.loop.frame,
            room: { width: WIDTH, height: HEIGHT },
            camera: { x: camera.scrollX, y: camera.scrollY, width: camera.width, height: camera.height, zoom: camera.zoom },
            chaos: { score: this.chaos.score, damagedObjects: this.chaos.count, anger: angerFor(this.chaos.score).id },
            vases: this.vases.map(vase => vase.snapshot()),
            couch: { ...this.couchScratch.snapshot(), events: this.couchEvents, lastDamage: this.lastCouchDamage },
            curtain: { ...this.curtainSlide.snapshot(), events: this.curtainEvents, lastDamage: this.lastCurtainDamage },
            plant: { ...this.plantNibble.snapshot(), angle: this.plantGraphic.angle, events: this.plantEvents, lastDamage: this.lastPlantDamage },
            pixel: {
              x: this.pixel.x, y: this.pixel.y, bottom: body.bottom,
              left: body.left, top: body.top, bodyWidth: body.width, bodyHeight: body.height,
              displayWidth: this.pixelVisual.displayWidth, displayHeight: this.pixelVisual.displayHeight,
              velocityX: body.velocity.x, velocityY: body.velocity.y,
              grounded: body.blocked.down, climbing: this.climbing, gravity: body.allowGravity,
              animation: this.pixel.anims.currentAnim?.key ?? null,
              animationFrame: Number(this.pixel.frame.name),
              flipX: this.pixel.flipX,
              texture: this.pixel.texture.key,
            },
          };
        });
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, removeObserver);
      });
    }
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.input.keyboard?.clearCaptures());
    // A lost key-up on tab switch must never leave Pixel moving.
    this.game.events.on(Phaser.Core.Events.BLUR, this.releaseKeys, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.game.events.off(Phaser.Core.Events.BLUR, this.releaseKeys, this));
  }

  private releaseKeys() { this.input.keyboard?.resetKeys(); }

  private addPlatform(x: number, y: number, width: number, height: number) {
    const surface = this.add.rectangle(x + width / 2, y + height / 2, width, height, 0, 0);
    this.physics.add.existing(surface, true);
    this.platforms.add(surface);
    return surface;
  }

  private drawRoom() {
    const g = this.add.graphics();
    const rect = (x: number, y: number, w: number, h: number, color: number) => { g.fillStyle(color); g.fillRect(x, y, w, h); };
    rect(0, 0, WIDTH, FLOOR_Y, 0xcbb192);
    rect(0, 0, WIDTH, 14, 0x927660);
    for (let x = 32; x < WIDTH; x += 64) rect(x, 14, 2, 440, 0xc4a789);
    rect(0, 340, WIDTH, 114, 0xa68a72);
    for (let x = 0; x < WIDTH; x += 48) rect(x, 344, 2, 110, 0x947963);
    rect(0, 454, WIDTH, 14, 0x705547);
    rect(0, FLOOR_Y, WIDTH, HEIGHT - FLOOR_Y, 0x9f7154);
    for (let y = 484; y < HEIGHT; y += 24) rect(0, y, WIDTH, 2, 0x865c47);
    for (let x = 0; x < WIDTH; x += 96) rect(x, 470, 2, 14, 0x865c47);
    // Window and the clearly outlined curtain, which doubles as a climb zone.
    rect(700, 90, 164, 240, 0x705547);
    rect(708, 98, 148, 224, 0x91b1af);
    rect(714, 104, 134, 100, 0xb0c6b8);
    rect(777, 98, 8, 224, 0xe4d0ab);
    rect(708, 205, 148, 8, 0xe4d0ab);
    rect(730, 101, 140, 10, 0x59443d);
    rect(CURTAIN.x, CURTAIN.y, CURTAIN.width, CURTAIN.height, 0xa5654e);
    for (let x = 748; x < 856; x += 18) { rect(x, 112, 7, 356, 0xbd8060); rect(x + 7, 112, 4, 356, 0x95553f); }
    g.lineStyle(2, 0xeac791, 0.9).strokeRect(CURTAIN.x, CURTAIN.y, CURTAIN.width, CURTAIN.height);
    // Couch: a broad seat reachable from the floor.
    rect(190, 310, 232, 65, 0x687a63);
    rect(198, 318, 104, 46, 0x809077); rect(310, 318, 104, 46, 0x809077);
    rect(180, 370, 254, 28, 0x93a184);
    rect(180, 398, 254, 32, 0x596d57);
    rect(172, 348, 24, 69, 0x72866b); rect(418, 348, 24, 69, 0x72866b);
    rect(192, 430, 12, 38, 0x59443d); rect(410, 430, 12, 38, 0x59443d);
    rect(218, 335, 47, 32, 0xd7ab71);
    // Shelves: each visible top is also a solid physics platform.
    for (const [x, y, w] of [[518, 304, 146], [648, 224, 96], [856, 154, 80]]) {
      rect(x, y, w, 16, 0x70503e); rect(x, y, w, 4, 0xc49464);
      rect(x + 12, y + 16, 8, 20, 0x87644a); rect(x + w - 20, y + 16, 8, 20, 0x87644a);
    }
    rect(536, 270, 12, 34, 0xa7614e); rect(550, 278, 10, 26, 0x778775); rect(562, 266, 12, 38, 0xc6a36e);
    // Framed picture and rug: decorative placeholders only.
    rect(282, 112, 108, 112, 0x795a43); rect(290, 120, 92, 96, 0xefe0ba);
    rect(302, 168, 68, 36, 0xa0a486); rect(322, 146, 28, 28, 0xd1a167);
    rect(245, 493, 430, 30, 0xbe906c); rect(255, 501, 410, 3, 0xddba8b);
    this.add.text(525, 336, 'SHELVES', { fontFamily: 'monospace', fontSize: '10px', color: '#725b46' });
  }

  private makeVaseTexture() {
    if (this.textures.exists('vase')) return;
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xffffff);
    g.fillRect(5, 0, 8, 8);
    g.fillRect(2, 8, 14, 16);
    g.fillRect(4, 24, 10, 4);
    g.fillStyle(0xd3d3d3);
    g.fillRect(5, 0, 8, 3);
    g.fillRect(12, 9, 3, 14);
    g.generateTexture('vase', 18, 28);
    g.destroy();
  }

  private updateScore() {
    const anger = angerFor(this.chaos.score);
    this.scoreText.setText(`CHAOS: ${this.chaos.score}  ·  SARAS ÄRGER (VORSCHAU): ${anger.label}`);
    this.angerBar.clear().fillStyle(0x705547, 0.25).fillRect(26, 70, 160, 6);
    this.angerBar.fillStyle(anger.color).fillRect(26, 70, 160 * Math.min(this.chaos.score / MAX_CHAOS_SCORE, 1), 6);
  }

  private breakVase(vase: Vase) {
    if (!this.chaos.award(vase.config.id, vase.config.points)) return;
    // Deterministic placeholder shards: visible feedback without a second physics system.
    for (let i = 0; i < 7; i++) {
      const shard = this.add.rectangle(vase.x, FLOOR_Y - 3, 4 + i % 3, 3, vase.config.color);
      this.fragments.push(shard);
      this.tweens.add({ targets: shard, x: Phaser.Math.Clamp(vase.x + (i - 3) * 9, 4, WIDTH - 4), y: FLOOR_Y - 2 - i % 2, angle: i * 31, duration: 240 });
    }
    this.updateScore();
  }

  private resetRoom() {
    this.climbing = false;
    this.grabBlockedUntil = 0;
    this.mustLeaveCurtain = false;
    const body = this.pixel.body as Phaser.Physics.Arcade.Body;
    body.reset(110, FLOOR_Y - 16 * PIXEL_SCALE);
    body.setAllowGravity(true);
    for (const vase of this.vases) vase.restore();
    for (const shard of this.fragments) {
      this.tweens.killTweensOf(shard);
      shard.destroy();
    }
    this.fragments = [];
    this.chaos.reset();
    this.couchScratch.reset();
    this.curtainSlide.reset();
    this.previousCurtainY = null;
    this.previousCurtainSpeed = 0;
    this.curtainEvents = 0;
    this.lastCurtainDamage = null;
    this.curtainMarks.clear();
    this.plantNibble.reset();
    this.plantEvents = 0;
    this.lastPlantDamage = null;
    this.plantGraphic.setAngle(0).setPosition(PLANT_NIBBLE.x, FLOOR_Y);
    this.spilledSoil.clear();
    this.drawPlant();
    this.couchEvents = 0;
    this.lastCouchDamage = null;
    this.scratchMarks.clear();
    this.scratchingPaws.clear();
    this.pixel.anims.stop();
    this.pixel.setTexture('pixel', 0);
    this.wasAirborne = false;
    this.landingUntil = 0;
    this.pixel.play('idle');
    this.syncPixelVisual('idle');
    this.status.setText('PIXEL · HOME ALONE');
    this.updateScore();
  }

  private makeCatAnimations() {
    for (const [key, config] of Object.entries(PIXEL_ANIMATIONS)) {
      if (!this.anims.exists(key)) this.anims.create({
        key, frames: config.frames.map(frame => ({ key: 'pixel', frame })),
        frameRate: config.frameRate, repeat: config.repeat,
      });
    }
  }

  private updateAnimation(time: number) {
    const body = this.pixel.body as Phaser.Physics.Arcade.Body;
    if (this.wasAirborne && body.blocked.down && body.velocity.y >= 0) this.landingUntil = time + 140;
    this.wasAirborne = !this.climbing && (!body.blocked.down || body.velocity.y < -1);
    const plant = this.plantNibble.snapshot().state;
    const animation = pixelAnimation({
      climbing: this.climbing, sliding: this.curtainSlide.snapshot().state === 'sliding',
      grounded: body.blocked.down, velocityX: body.velocity.x, velocityY: body.velocity.y,
      scratching: this.couchScratch.snapshot().state === 'scratching',
      nibbling: plant === 'nibbling' || plant === 'wobbling', landing: time < this.landingUntil,
    });
    this.pixel.play(animation, true);
    if (this.climbing) this.pixel.setFlipX(false);
    this.syncPixelVisual(animation);
  }

  private syncPixelVisual(animation: keyof typeof PIXEL_ANIMATIONS) {
    const body = this.pixel.body as Phaser.Physics.Arcade.Body;
    const scale = PIXEL_ANIMATIONS[animation].scale;
    // Pose proportions vary; rendering follows the feet, never resizes the physics body.
    this.pixelVisual.setTexture('pixel', this.pixel.frame.name).setFlipX(this.pixel.flipX)
      .setScale(scale).setPosition(body.center.x, body.bottom - 16 * scale);
  }

  private updateCouch(delta: number) {
    const body = this.pixel.body as Phaser.Physics.Arcade.Body;
    const hasInput = this.cursors.left.isDown || this.cursors.right.isDown || this.cursors.up.isDown || this.cursors.down.isDown || this.jump.isDown;
    const nearCouch = this.pixel.x >= COUCH_SCRATCH.minX && this.pixel.x <= COUCH_SCRATCH.maxX;
    const onCouchSurface = Math.abs(body.bottom - FLOOR_Y) < 2 || (this.pixel.x >= 180 && this.pixel.x <= 434 && Math.abs(body.bottom - 370) < 2);
    const eligible = nearCouch && onCouchSurface && body.blocked.down && !this.climbing && !hasInput && Math.abs(body.velocity.x) < 1 && Math.abs(body.velocity.y) < 1;
    const event = this.couchScratch.update(delta, eligible);
    if (event) {
      this.couchEvents++;
      this.lastCouchDamage = event;
      if (this.chaos.award(`couch-scratch-${event.stage}`, event.value, event.objectId)) this.updateScore();
      this.events.emit('object-damaged', event);
      const x = Phaser.Math.Clamp(this.pixel.x + (this.pixel.x > 307 ? -12 : 12) + (event.stage % 3) * 3, 184, 426);
      const y = body.bottom > 400 ? 408 : 331;
      this.scratchMarks.lineStyle(2, 0xe3cba4);
      for (let i = 0; i < 3; i++) this.scratchMarks.lineBetween(x + i * 4, y, x + i * 4 - 4, y + 15 + event.stage);
    }
    this.scratchingPaws.clear();
    if (this.couchScratch.snapshot().state === 'scratching') {
      this.pixel.setFlipX(this.pixel.x > 307);
      const direction = this.pixel.flipX ? -1 : 1;
      const pawScale = PIXEL_ANIMATIONS.scratch.scale;
      const pawY = body.bottom - 16 * pawScale;
      const lift = Number(this.pixel.frame.name) % 2 === 0 ? 0 : 6;
      this.scratchingPaws.lineStyle(3, 0xe3cba4);
      for (let i = 0; i < 2; i++) {
        this.scratchingPaws.lineBetween(this.pixel.x + direction * 9 * pawScale, pawY - 4 + i * 4,
          this.pixel.x + direction * 20 * pawScale, pawY - (body.bottom > 400 ? 35 : 20) + lift + i * 4);
      }
    }
  }

  private drawPlant() {
    const g = this.plantGraphic.clear();
    const bitten = this.plantNibble.snapshot().damage > 0;
    // A tuft of cat grass, without Monstera's broad split leaves.
    g.lineStyle(3, 0x596d57);
    for (let i = 0; i < 7; i++) {
      const x = (i - 3) * 4;
      const height = 22 + (i % 3) * 5 - (bitten && i > 3 ? 9 : 0);
      g.lineBetween(x, -19, x + (i - 3) * 2, -19 - height);
    }
    g.fillStyle(0x718463);
    for (let i = 0; i < 5; i++) g.fillRect((i - 2) * 6, -30 - (i % 2) * 9, 3, 12);
    g.fillStyle(0xb47655).fillRect(-17, -20, 34, 20);
    g.fillStyle(0xc98a64).fillRect(-20, -23, 40, 5);
    g.fillStyle(0x59443d).fillRect(-15, -23, 30, 3);
    if (bitten) g.fillStyle(0x91a07a).fillRect(8, -29, 5, 3);
  }

  private updatePlant(time: number, delta: number) {
    const body = this.pixel.body as Phaser.Physics.Arcade.Body;
    const hasInput = this.cursors.left.isDown || this.cursors.right.isDown || this.cursors.up.isDown || this.cursors.down.isDown || this.jump.isDown;
    const eligible = this.pixel.x >= PLANT_NIBBLE.minX && this.pixel.x <= PLANT_NIBBLE.maxX &&
      Math.abs(body.bottom - FLOOR_Y) < 2 && body.blocked.down && !this.climbing && !hasInput && Math.abs(body.velocity.x) < 1 && Math.abs(body.velocity.y) < 1;
    const event = this.plantNibble.update(delta, eligible);
    if (event) {
      this.plantEvents++;
      this.lastPlantDamage = event;
      if (this.chaos.award(`plant-${event.kind}`, event.value, event.objectId)) this.updateScore();
      this.events.emit('object-damaged', event);
      this.drawPlant();
      if (event.kind === 'tip') {
        this.plantGraphic.setAngle(-80).setPosition(PLANT_NIBBLE.x + 10, FLOOR_Y - 17);
        this.spilledSoil.fillStyle(0x59443d);
        for (let i = 0; i < 12; i++) this.spilledSoil.fillRect(36 + (i * 13) % 74, FLOOR_Y - 2 - i % 3, 4 + i % 3, 3);
      }
    }
    const { state, progress } = this.plantNibble.snapshot();
    const active = state === 'nibbling' || state === 'wobbling';
    if (state !== 'tipped') {
      this.plantGraphic.setAngle(state === 'wobbling' ? Math.sin(progress * Math.PI * 8) * (5 + progress * 12) : active ? Math.sin(time / 80) * 2 : 0);
    }
    if (active) {
      this.pixel.setFlipX(this.pixel.x > PLANT_NIBBLE.x);
    }
  }

  private updateCurtain(movingUp: boolean) {
    const body = this.pixel.body as Phaser.Physics.Arcade.Body;
    const state = !this.climbing ? 'detached' : movingUp ? 'climbing' : 'sliding';
    // Derive elapsed slide time from actual travel and the previous commanded speed.
    // Render frames without a physics step must neither create damage nor reset its timer.
    const distance = this.previousCurtainY === null ? 0 : body.y - this.previousCurtainY;
    const movementMs = distance > 0 && this.previousCurtainSpeed > 0 ? distance / this.previousCurtainSpeed * 1000 : 0;
    this.previousCurtainY = body.y;
    this.previousCurtainSpeed = state === 'sliding' ? body.velocity.y : 0;
    const event = this.curtainSlide.update(movementMs, state, movementMs > 0 && !body.blocked.down);
    if (!event) return;
    this.curtainEvents++;
    this.lastCurtainDamage = event;
    if (this.chaos.award(`curtain-tear-${event.stage}`, event.value, event.objectId)) this.updateScore();
    this.events.emit('object-damaged', event);
    const side = this.pixel.x > CURTAIN.centerX ? -1 : 1;
    const x = Phaser.Math.Clamp(this.pixel.x + side * (22 * PIXEL_SCALE + (event.stage % 3) * 4), CURTAIN.left + 8, CURTAIN.right - 8);
    const y = Phaser.Math.Clamp(this.pixel.y - 14, CURTAIN.top + 4, CURTAIN.bottom - 38);
    this.curtainMarks.lineStyle(3, 0x59443d).beginPath();
    this.curtainMarks.moveTo(x, y).lineTo(x - 3, y + 8).lineTo(x + 2, y + 18).lineTo(x - 2, y + 30).strokePath();
    this.curtainMarks.lineStyle(1, 0xeac791);
    for (let i = 0; i < 4; i++) this.curtainMarks.lineBetween(x - 5, y + i * 7, x + 5, y + i * 7 + 2);
  }

  update(time: number, delta: number) {
    if (!this.pixel) return;
    const body = this.pixel.body as Phaser.Physics.Arcade.Body;
    const horizontal = Number(this.cursors.right.isDown) - Number(this.cursors.left.isDown);
    const vertical = Number(this.cursors.down.isDown) - Number(this.cursors.up.isDown);
    const overlapsCurtain = Phaser.Geom.Intersects.RectangleToRectangle(new Phaser.Geom.Rectangle(body.x, body.y, body.width, body.height), CURTAIN);
    const jumpPressed = Phaser.Input.Keyboard.JustDown(this.jump);
    if (Phaser.Input.Keyboard.JustDown(this.reset)) {
      this.resetRoom();
      return;
    }
    for (const vase of this.vases) vase.updateFall();
    if (!overlapsCurtain) this.mustLeaveCurtain = false;
    const canGrab = !this.mustLeaveCurtain && time >= this.grabBlockedUntil && !jumpPressed;
    const jumpingIntoCurtain = !body.blocked.down && horizontal !== 0 && Math.abs(body.velocity.y) > 1;
    if (!this.climbing && canGrab && overlapsCurtain && (vertical < 0 || (vertical > 0 && !body.blocked.down) || jumpingIntoCurtain)) this.climbing = true;
    if (this.climbing && (!overlapsCurtain || (vertical >= 0 && body.blocked.down))) {
      this.climbing = false;
      this.grabBlockedUntil = overlapsCurtain ? time : time + 250;
    }
    body.setAllowGravity(!this.climbing);
    if (this.climbing) {
      const speedY = vertical < 0 ? -CURTAIN_SLIDE.climbSpeed : vertical > 0 ? CURTAIN_SLIDE.descendSpeed : CURTAIN_SLIDE.slideSpeed;
      this.pixel.setVelocity(horizontal * 110, speedY);
      if (jumpPressed) {
        this.climbing = false;
        this.grabBlockedUntil = time + 250;
        this.mustLeaveCurtain = true;
        body.setAllowGravity(true);
        this.pixel.setVelocity((horizontal || -1) * 240, -340);
      }
    } else {
      if (body.blocked.down) this.pixel.setVelocityX(horizontal * 230);
      else if (horizontal !== 0) this.pixel.setVelocityX(Phaser.Math.Clamp(body.velocity.x + horizontal * 700 * Math.min(delta, 50) / 1000, -240, 240));
      if (jumpPressed && body.blocked.down) this.pixel.setVelocityY(-480);
    }
    if (horizontal !== 0) this.pixel.setFlipX(horizontal < 0);
    this.climbHint.setAlpha(overlapsCurtain ? 1 : 0.65);
    this.updateCurtain(vertical < 0);
    this.updateCouch(delta);
    this.updatePlant(time, delta);
    this.updateAnimation(time);
    const plantState = this.plantNibble.snapshot().state;
    this.status.setText(plantState === 'wobbling' ? 'PIXEL · VORSICHT, DER TOPF WACKELT!' : plantState === 'nibbling' ? 'PIXEL · KATZENGRAS KNABBERN' : this.couchScratch.snapshot().state === 'scratching' ? 'PIXEL · SOFA KRATZEN' : this.curtainSlide.snapshot().state === 'sliding' ? 'PIXEL · VORHANG RUTSCHEN' : this.climbing ? 'PIXEL · CURTAIN CLIMBING' : 'PIXEL · HOME ALONE');
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: WIDTH,
  height: HEIGHT,
  pixelArt: true,
  backgroundColor: '#cbb192',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 1000 }, debug: false } },
  scene: LivingRoom,
});
