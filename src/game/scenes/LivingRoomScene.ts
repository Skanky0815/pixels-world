import Phaser from 'phaser';
import pixelSheetUrl from '../../../assets/pixel/pixel-sheet.png?url';
import { Pixel } from '../actors/Pixel';
import { InputController } from '../input/InputController';
import { ROOM, CURTAIN_BOUNDS, SHELVES } from '../config/room';
import { ChaosScore, VASES, angerFor } from '../domain/chaos';
import type { ChaosEvent } from '../domain/chaos-event';
import { overlaps, updateGroundInteractions, type Climbable, type Destructible, type Interactable, type InteractionContext, type ObjectLifecycle } from '../interactions/contracts';
import { Vase } from '../objects/Vase';
import { Couch } from '../objects/Couch';
import { Curtain } from '../objects/Curtain';
import { Plant } from '../objects/Plant';
import { GameHud } from '../ui/GameHud';
import { COUCH_SCRATCH } from '../interactions/couch-scratching';
import { CURTAIN_SLIDE } from '../interactions/curtain-sliding';
import { PLANT_NIBBLE } from '../interactions/plant-nibbling';

const { width: WIDTH, height: HEIGHT, floorY: FLOOR_Y } = ROOM;

export class LivingRoomScene extends Phaser.Scene {
  private pixel!: Pixel;
  private controls!: InputController;
  private generation = 0;
  private hud!: GameHud;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private readonly chaos = new ChaosScore();
  private couch!: Couch;
  private curtain!: Curtain;
  private plant!: Plant;
  private vases: Vase[] = [];
  private objects: ObjectLifecycle[] = [];
  private groundObjects: Interactable[] = [];
  private climbables: Climbable[] = [];
  private destructibles: Destructible[] = [];

  constructor() { super('LivingRoom'); }

  preload() {
    this.load.spritesheet('pixel', pixelSheetUrl, { frameWidth: 32, frameHeight: 32 });
  }

  create() {
    const generation = ++this.generation;
    this.chaos.reset();
    this.drawRoom();
    this.platforms = this.physics.add.staticGroup();
    const floor = this.addPlatform(0, FLOOR_Y, WIDTH, HEIGHT - FLOOR_Y);
    for (const shelf of SHELVES) this.addPlatform(shelf.x, shelf.y, shelf.width, shelf.height);
    this.couch = new Couch(this, { id: 'couch', seat: { x: 180, y: 370, width: 254, height: 28 }, floorY: FLOOR_Y, reach: 20, rules: COUCH_SCRATCH });
    this.curtain = new Curtain(this, { id: 'curtain', area: CURTAIN_BOUNDS, rules: CURTAIN_SLIDE });
    this.plant = new Plant(this, { id: 'plant', x: 82, floorY: FLOOR_Y,
      reach: { left: -38, right: 22 }, rules: PLANT_NIBBLE });
    this.platforms.add(this.couch.platform);
    this.pixel = new Pixel(this, { x: 110, bottom: FLOOR_Y });
    this.physics.add.collider(this.pixel.collider, this.platforms);
    this.vases = VASES.map(config => {
      const vase = new Vase(this, { ...config, floorY: FLOOR_Y, roomWidth: WIDTH });
      this.physics.add.collider(vase.collider, this.platforms, (_object, surface) => {
        if (surface === floor) this.processDamage(vase.breakOnFloor());
      });
      this.physics.add.collider(this.pixel.collider, vase.collider, () => {
        const body = vase.collider.body as Phaser.Physics.Arcade.Body;
        if (body.touching.left || body.touching.right) vase.push(this.pixel.x < vase.collider.x ? 1 : -1);
      });
      return vase;
    });
    this.groundObjects = [this.couch, this.plant];
    this.climbables = [this.curtain];
    this.destructibles = [this.couch, this.curtain, this.plant, ...this.vases];
    this.objects = [this.couch, this.curtain, this.plant, ...this.vases];
    if (new Set(this.destructibles.map(object => object.id)).size !== this.destructibles.length) throw new Error('Duplicate object IDs');
    for (const object of this.objects) object.reset();
    this.controls = new InputController(this);
    this.hud = new GameHud(this);
    this.renderHud(false);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      for (const object of this.objects) object.destroy();
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
            couch: this.couch.snapshot(),
            curtain: this.curtain.snapshot(),
            plant: this.plant.snapshot(),
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
    // Shelves: each visible top is also a solid physics platform.
    for (const { x, y, width: w, height: h } of SHELVES) {
      rect(x, y, w, h, 0x70503e); rect(x, y, w, 4, 0xc49464);
      rect(x + 12, y + 16, 8, 20, 0x87644a); rect(x + w - 20, y + 16, 8, 20, 0x87644a);
    }
    rect(536, 270, 12, 34, 0xa7614e); rect(550, 278, 10, 26, 0x778775); rect(562, 266, 12, 38, 0xc6a36e);
    // Framed picture and rug: decorative placeholders only.
    rect(282, 112, 108, 112, 0x795a43); rect(290, 120, 92, 96, 0xefe0ba);
    rect(302, 168, 68, 36, 0xa0a486); rect(322, 146, 28, 28, 0xd1a167);
    rect(245, 493, 430, 30, 0xbe906c); rect(255, 501, 410, 3, 0xddba8b);
    this.add.text(525, 336, 'SHELVES', { fontFamily: 'monospace', fontSize: '10px', color: '#725b46' });
  }

  private renderHud(nearCurtain: boolean) {
    const maximumScore = this.destructibles.reduce((sum, object) => sum + object.maximumScore, 0);
    this.hud.render({
      score: this.chaos.score,
      anger: angerFor(this.chaos.score),
      angerRatio: maximumScore > 0 ? this.chaos.score / maximumScore : 0,
      activity: this.pixel.activity,
      nearCurtain,
    });
  }

  private processDamage(event: ChaosEvent | undefined) {
    if (event && this.chaos.awardEvent(event)) this.events.emit('object-damaged', event);
  }

  update(time: number, delta: number) {
    if (!this.pixel) return;
    const input = this.controls.read(this.game.loop.frame);
    if (input.resetPressed) { this.scene.restart(); return; }
    for (const vase of this.vases) vase.updateFall();
    const before = this.pixel.snapshot();
    const surface = this.climbables.find(object => overlaps(before, object.climbArea));
    this.pixel.move(input, time, delta, surface?.climbArea);
    const context: InteractionContext = Object.freeze({ time, delta, input, pixel: Object.freeze(this.pixel.snapshot()) });
    for (const object of this.climbables) this.processDamage(object.updateClimb(context, object === surface && context.pixel.climbing));
    const interaction = updateGroundInteractions(this.groundObjects, context);
    this.processDamage(interaction.event);
    if (interaction.faceX !== undefined) this.pixel.faceToward(interaction.faceX);
    this.pixel.present(time, interaction.action, this.curtain.snapshot().state === 'sliding');
    this.renderHud(this.pixel.nearCurtain);
  }
}
