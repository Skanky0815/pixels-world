import { preloadPictureArt } from '../game/assets/picture-art';
import { preloadBookArt } from '../game/assets/book-art';
import { preloadRoomArt } from '../game/assets/room-art';
import { preloadShelfArt } from '../game/assets/shelf-art';
import type { Shelf } from '../game/objects/Shelf';
import { preloadCatgrassArt } from '../game/assets/catgrass-art';
import { preloadCurtainArt } from '../game/assets/curtain-art';
import { preloadCouchArt } from '../game/assets/couch-art';
import { preloadVaseArt } from '../game/assets/vase-art';
import Phaser from 'phaser';
import { ASSETS } from '../game/assets/definitions';
import { spriteUrl } from '../game/assets/urls';
import { Pixel } from '../game/actors/Pixel';
import { buildObjects } from '../game/content/build-objects';
import {
  createRoomPhysics,
  connectObjectPhysics,
  advanceObjectInteractions,
} from '../game/content/object-playfield';
import { ChaosScore } from '../game/domain/chaos';
import type { ChaosEvent } from '../game/domain/chaos-event';
import { InputController } from '../game/input/InputController';
import { PlayActivity } from '../game/input/play-activity';
import { playgroundRoom } from './playground-room';

export class PlaygroundScene extends Phaser.Scene {
  private shelves: Shelf[] = [];
  private variant = 'cozy-couch';
  private built!: ReturnType<typeof buildObjects>;
  private pixel!: Pixel;
  private controls!: InputController;
  private activity!: PlayActivity;
  private readonly chaos = new ChaosScore();
  private eventsLog: ChaosEvent[] = [];
  private elapsed = 0;
  private generation = 0;

  constructor(
    private readonly diagnose: (snapshot: ReturnType<PlaygroundScene['snapshot']>) => void,
  ) {
    super('InteractablePlayground');
  }

  init(data: { variant?: string }) {
    if (data.variant) this.variant = data.variant;
    this.elapsed = 0;
    this.eventsLog = [];
    this.chaos.reset();
    this.generation++;
  }

  // eslint-disable-next-line max-lines-per-function -- Gemeinsame Objektbilder und Pixels Sprite-Sheet werden in einer Vorladephase registriert.
  preload() {
    preloadVaseArt(this);
    preloadPictureArt(this);
    preloadBookArt(this);
    preloadShelfArt(this);
    preloadRoomArt(this);
    preloadCouchArt(this);
    preloadCurtainArt(this);
    preloadCatgrassArt(this);
    const asset = ASSETS.pixel;

    this.load.spritesheet('pixel', spriteUrl('pixel'), {
      frameWidth: asset.frameWidth,
      frameHeight: asset.frameHeight,
    });
  }

  // eslint-disable-next-line max-lines-per-function -- Ein gemeinsamer Aufbau besitzt reale Adapter, Steuerung und deren Lebensdauer; keine Runde oder persistente Ergebnisse.
  create() {
    const room = playgroundRoom(this.variant);
    const { platforms, floor, shelves } = createRoomPhysics(this, room.definition);

    this.shelves = shelves;

    this.physics.disableUpdate();
    this.built = buildObjects(this, room);
    this.pixel = new Pixel(this, room.spawn);
    connectObjectPhysics(this, this.built, this.pixel, platforms, floor, (event) =>
      this.damage(event),
    );

    for (const { object } of this.built.entries) object.reset();
    this.controls = new InputController(this);
    this.controls.setActionLabel('Sprung');
    this.activity = new PlayActivity(() => this.syncActivity());
    this.syncActivity();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.shutdown());
    this.diagnose(this.snapshot());
  }

  private syncActivity() {
    this.pixel.setPaused(!this.activity.active);

    if (this.activity.active) {
      this.physics.world.resume();
      this.tweens.resumeAll();
    } else this.pauseWorld();
  }

  private pauseWorld() {
    this.physics.world.pause();
    this.tweens.pauseAll();
    this.controls.release();
  }

  // eslint-disable-next-line max-lines-per-function -- Manuelle Physik und gemeinsamer Interaktionsschritt laufen wie in der Hauptszene in fester Reihenfolge.
  update(_time: number, delta: number) {
    const input = this.controls.read(this.game.loop.frame);

    if (input.resetPressed) return void this.scene.restart({ variant: this.variant });
    const elapsed = this.activity.delta(delta);

    if (elapsed > 0) {
      this.elapsed += elapsed;
      this.physics.world.update(this.elapsed, elapsed);
      advanceObjectInteractions(
        this.built,
        this.pixel,
        input,
        this.elapsed,
        elapsed,
        (event) => this.damage(event),
        this.shelves,
      );
    }

    this.diagnose(this.snapshot());
  }

  private damage(event: ChaosEvent | undefined) {
    if (event && this.chaos.awardEvent(event))
      this.eventsLog = [...this.eventsLog.slice(-63), event];
  }

  // eslint-disable-next-line max-lines-per-function -- Nur losgelöste Diagnosewerte für die sichtbare DEV-Oberfläche, keine Engine-Referenzen oder Testsetter.
  snapshot() {
    return {
      generation: this.generation,
      variant: this.variant,
      kind: this.built.entries[0].definition.kind,
      score: this.chaos.score,
      events: [...this.eventsLog],
      object: this.built.entries[0].object.snapshot(),
      pixel: this.pixel.snapshot(),
      shelves: this.shelves.map((shelf) => shelf.snapshot()),
      resources: {
        objects: this.built.entries.length,
        bodies: this.physics.world.bodies.size,
        staticBodies: this.physics.world.staticBodies.size,
        colliders: this.physics.world.colliders.getActive().length,
        blurListeners: this.game.events.listenerCount(Phaser.Core.Events.BLUR),
      },
    };
  }

  private shutdown() {
    this.controls.destroy();
    this.activity.destroy();
    this.pixel.destroy();

    for (const { object } of this.built.entries) object.destroy();
  }
}
