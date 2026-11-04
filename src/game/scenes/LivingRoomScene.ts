import Phaser from 'phaser';
import pixelSheetUrl from '../../../assets/pixel/pixel-sheet.png?url';
import { PIXEL_ANIMATIONS } from '../actors/pixel-animations';
import { Pixel } from '../actors/Pixel';
import { InputController } from '../input/InputController';
import type { InputState } from '../input/input-state';
import { ROOM, CURTAIN_BOUNDS } from '../config/room';
import { ChaosScore, VASES, angerFor } from '../../chaos';
import { Vase } from '../../vase';
import { GameHud } from '../ui/GameHud';
import { COUCH_SCRATCH, CouchScratching, type CouchDamageEvent } from '../../couch-scratching';
import { CURTAIN_SLIDE, CurtainSliding, type CurtainDamageEvent } from '../../curtain-sliding';
import { PLANT_NIBBLE, PlantNibbling, type PlantDamageEvent } from '../../plant-nibbling';

const { width: WIDTH, height: HEIGHT, floorY: FLOOR_Y } = ROOM;
const PIXEL_SCALE = 2;
const MAX_CHAOS_SCORE = VASES.reduce((sum, vase) => sum + vase.points, 0) + COUCH_SCRATCH.maxDamage * COUCH_SCRATCH.damageValue + CURTAIN_SLIDE.maxDamage * CURTAIN_SLIDE.damageValue + PLANT_NIBBLE.nibbleValue + PLANT_NIBBLE.tipValue;
const CURTAIN = new Phaser.Geom.Rectangle(CURTAIN_BOUNDS.x, CURTAIN_BOUNDS.y, CURTAIN_BOUNDS.width, CURTAIN_BOUNDS.height);

export class LivingRoomScene extends Phaser.Scene {
  private pixel!: Pixel;
  private controls!: InputController;
  private generation = 0;
  private hud!: GameHud;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private readonly chaos = new ChaosScore();
  private vases: Vase[] = [];
  private fragments: Phaser.GameObjects.Rectangle[] = [];
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

  constructor() { super('LivingRoom'); }

  preload() {
    this.load.spritesheet('pixel', pixelSheetUrl, { frameWidth: 32, frameHeight: 32 });
  }

  create() {
    const generation = ++this.generation;
    this.initializeRound();
    this.drawRoom();
    this.plantGraphic = this.add.graphics({ x: PLANT_NIBBLE.x, y: FLOOR_Y });
    this.spilledSoil = this.add.graphics();
    this.drawPlant();
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
    this.pixel = new Pixel(this, { x: 110, bottom: FLOOR_Y });
    this.physics.add.collider(this.pixel.collider, this.platforms);
    this.vases = VASES.map(config => {
      const vase = new Vase(this, config);
      this.physics.add.collider(vase, this.platforms, (_object, surface) => {
        if (surface === floor && vase.breakOnFloor()) this.breakVase(vase);
      });
      this.physics.add.collider(this.pixel.collider, vase, () => {
        const body = vase.body as Phaser.Physics.Arcade.Body;
        if (body.touching.left || body.touching.right) {
          vase.push(this.pixel.x < vase.x ? 1 : -1);
        }
      });
      return vase;
    });
    this.controls = new InputController(this);
    this.hud = new GameHud(this);
    this.renderHud(false);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.controls.destroy();
      this.pixel.destroy();
      this.hud.destroy();
    });
    this.cameras.main.setBounds(0, 0, WIDTH, HEIGHT);
    if (import.meta.env.MODE === 'e2e') {
      void import('../../test-observer').then(({ installTestObserver }) => {
        if (!this.scene.isActive() || this.generation !== generation) return;
        const removeObserver = installTestObserver(() => {
          const camera = this.cameras.main;
          return {
            ready: this.scene.isActive(), scene: this.scene.key, frame: this.game.loop.frame,
            generation, blurListeners: this.game.events.listenerCount(Phaser.Core.Events.BLUR),
            room: { width: WIDTH, height: HEIGHT },
            camera: { x: camera.scrollX, y: camera.scrollY, width: camera.width, height: camera.height, zoom: camera.zoom },
            chaos: { score: this.chaos.score, damagedObjects: this.chaos.count, anger: angerFor(this.chaos.score).id },
            hud: this.hud.snapshot(),
            vases: this.vases.map(vase => vase.snapshot()),
            couch: { ...this.couchScratch.snapshot(), events: this.couchEvents, lastDamage: this.lastCouchDamage },
            curtain: { ...this.curtainSlide.snapshot(), events: this.curtainEvents, lastDamage: this.lastCurtainDamage },
            plant: { ...this.plantNibble.snapshot(), angle: this.plantGraphic.angle, events: this.plantEvents, lastDamage: this.lastPlantDamage },
            pixel: this.pixel.snapshot(),
          };
        });
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, removeObserver);
      });
    }
  }

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

  private renderHud(nearCurtain: boolean) {
    this.hud.render({
      score: this.chaos.score,
      anger: angerFor(this.chaos.score),
      angerRatio: this.chaos.score / MAX_CHAOS_SCORE,
      activity: this.pixel.activity,
      nearCurtain,
    });
  }

  private breakVase(vase: Vase) {
    if (!this.chaos.award(vase.config.id, vase.config.points)) return;
    // Deterministic placeholder shards: visible feedback without a second physics system.
    for (let i = 0; i < 7; i++) {
      const shard = this.add.rectangle(vase.x, FLOOR_Y - 3, 4 + i % 3, 3, vase.config.color);
      this.fragments.push(shard);
      this.tweens.add({ targets: shard, x: Phaser.Math.Clamp(vase.x + (i - 3) * 9, 4, WIDTH - 4), y: FLOOR_Y - 2 - i % 2, angle: i * 31, duration: 240 });
    }
  }

  private initializeRound() {
    this.chaos.reset();
    this.couchScratch.reset();
    this.curtainSlide.reset();
    this.plantNibble.reset();
    this.vases = [];
    this.fragments = [];
    this.couchEvents = this.curtainEvents = this.plantEvents = 0;
    this.lastCouchDamage = this.lastCurtainDamage = this.lastPlantDamage = null;
    this.previousCurtainY = null;
    this.previousCurtainSpeed = 0;
  }

  private updateCouch(delta: number, input: InputState) {
    const body = this.pixel.contact;
    const hasInput = input.active;
    const nearCouch = this.pixel.x >= COUCH_SCRATCH.minX && this.pixel.x <= COUCH_SCRATCH.maxX;
    const onCouchSurface = Math.abs(body.bottom - FLOOR_Y) < 2 || (this.pixel.x >= 180 && this.pixel.x <= 434 && Math.abs(body.bottom - 370) < 2);
    const eligible = nearCouch && onCouchSurface && body.blocked.down && !this.pixel.isClimbing && !hasInput && Math.abs(body.velocity.x) < 1 && Math.abs(body.velocity.y) < 1;
    const event = this.couchScratch.update(delta, eligible);
    if (event) {
      this.couchEvents++;
      this.lastCouchDamage = event;
      this.chaos.award(`couch-scratch-${event.stage}`, event.value, event.objectId);
      this.events.emit('object-damaged', event);
      const x = Phaser.Math.Clamp(this.pixel.x + (this.pixel.x > 307 ? -12 : 12) + (event.stage % 3) * 3, 184, 426);
      const y = body.bottom > 400 ? 408 : 331;
      this.scratchMarks.lineStyle(2, 0xe3cba4);
      for (let i = 0; i < 3; i++) this.scratchMarks.lineBetween(x + i * 4, y, x + i * 4 - 4, y + 15 + event.stage);
    }
    this.scratchingPaws.clear();
    if (this.couchScratch.snapshot().state === 'scratching') {
      this.pixel.faceToward(307);
      const direction = this.pixel.flipX ? -1 : 1;
      const pawScale = PIXEL_ANIMATIONS.scratch.scale;
      const pawY = body.bottom - 16 * pawScale;
      const lift = this.pixel.frame % 2 === 0 ? 0 : 6;
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

  private updatePlant(time: number, delta: number, input: InputState) {
    const body = this.pixel.contact;
    const hasInput = input.active;
    const eligible = this.pixel.x >= PLANT_NIBBLE.minX && this.pixel.x <= PLANT_NIBBLE.maxX &&
      Math.abs(body.bottom - FLOOR_Y) < 2 && body.blocked.down && !this.pixel.isClimbing && !hasInput && Math.abs(body.velocity.x) < 1 && Math.abs(body.velocity.y) < 1;
    const event = this.plantNibble.update(delta, eligible);
    if (event) {
      this.plantEvents++;
      this.lastPlantDamage = event;
      this.chaos.award(`plant-${event.kind}`, event.value, event.objectId);
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
      this.pixel.faceToward(PLANT_NIBBLE.x);
    }
  }

  private updateCurtain(movingUp: boolean) {
    const body = this.pixel.contact;
    const state = !this.pixel.isClimbing ? 'detached' : movingUp ? 'climbing' : 'sliding';
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
    this.chaos.award(`curtain-tear-${event.stage}`, event.value, event.objectId);
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
    const input = this.controls.read(this.game.loop.frame);
    if (input.resetPressed) {
      this.scene.restart();
      return;
    }
    for (const vase of this.vases) vase.updateFall();
    this.pixel.move(input, time, delta, CURTAIN);
    this.updateCurtain(input.vertical < 0);
    this.updateCouch(delta, input);
    this.updatePlant(time, delta, input);
    const plant = this.plantNibble.snapshot().state;
    const groundAction = plant === 'wobbling' ? 'wobbling' : plant === 'nibbling' ? 'nibbling' :
      this.couchScratch.snapshot().state === 'scratching' ? 'scratching' : 'idle';
    this.pixel.present(time, groundAction, this.curtainSlide.snapshot().state === 'sliding');
    this.renderHud(this.pixel.nearCurtain);
  }
}
