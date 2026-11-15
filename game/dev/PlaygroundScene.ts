import { preloadTableclothArt } from '../play/assets/tablecloth-art';
import { preloadTrashBinArt } from '../play/assets/trash-bin-art';
import { preloadPantryArt } from '../play/assets/pantry-art';
import { GameAudio } from '../play/ui/GameAudio';
import { preloadObjectAudio } from '../play/assets/object-audio';
import { preloadCarpetArt } from '../play/assets/carpet-art';
import { preloadPictureArt } from '../play/assets/picture-art';
import { preloadFoodBagArt } from '../play/assets/food-bag-art';
import { preloadBookArt } from '../play/assets/book-art';
import { preloadRoomArt } from '../play/assets/room-art';
import { preloadFridgeArt } from '../play/assets/fridge-art';
import { preloadShelfArt } from '../play/assets/shelf-art';
import type { Shelf } from '../play/objects/Shelf';
import { preloadHerbArt } from '../play/assets/herb-art';
import { preloadCatgrassArt } from '../play/assets/catgrass-art';
import { preloadCurtainArt } from '../play/assets/curtain-art';
import { preloadCouchArt } from '../play/assets/couch-art';
import { preloadDishArt } from '../play/assets/dish-art';
import { preloadVaseArt } from '../play/assets/vase-art';
import Phaser from 'phaser';
import { ASSETS } from '../play/assets/definitions';
import { spriteUrl } from '../play/assets/urls';
import { Pixel } from '../play/actors/Pixel';
import { buildObjects } from '../play/content/build-objects';
import {
  createRoomPhysics,
  connectObjectPhysics,
  advanceObjectInteractions,
} from '../play/content/object-playfield';
import { ChaosScore } from '../play/domain/chaos';
import type { ChaosEvent } from '../play/domain/chaos-event';
import { InputController } from '../play/input/InputController';
import { PlayActivity } from '../play/input/play-activity';
import { selectedPlaygroundRoom, type PlaygroundSelection } from './playground-selection';
import { preloadKitchenArt } from '../play/assets/kitchen-art';
import type { ResolvedRoom } from '../play/content/definitions';

export class PlaygroundScene extends Phaser.Scene {
  private audio!: GameAudio;
  private shelves: Shelf[] = [];
  private room!: ResolvedRoom;
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
    private selection: PlaygroundSelection = { mode: 'object', id: 'cozy-couch' },
  ) {
    super('InteractablePlayground');
  }

  init(data: { selection?: PlaygroundSelection }) {
    if (data.selection) this.selection = data.selection;
    this.elapsed = 0;
    this.eventsLog = [];
    this.chaos.reset();
    this.generation++;
  }

  // eslint-disable-next-line max-lines-per-function -- Gemeinsame Objektbilder und Pixels Sprite-Sheet werden in einer Vorladephase registriert.
  preload() {
    preloadObjectAudio(this);
    preloadVaseArt(this);
    preloadDishArt(this);
    preloadPantryArt(this);
    preloadTrashBinArt(this);
    preloadTableclothArt(this);
    preloadCarpetArt(this);
    preloadPictureArt(this);
    preloadBookArt(this);
    preloadFoodBagArt(this);
    preloadShelfArt(this);
    preloadFridgeArt(this);
    preloadRoomArt(this);
    preloadKitchenArt(this);
    preloadCouchArt(this);
    preloadCurtainArt(this);
    preloadCatgrassArt(this);
    preloadHerbArt(this);
    const asset = ASSETS.pixel;

    this.load.spritesheet('pixel', spriteUrl('pixel'), {
      frameWidth: asset.frameWidth,
      frameHeight: asset.frameHeight,
    });
  }

  // eslint-disable-next-line max-lines-per-function -- Ein gemeinsamer Aufbau besitzt reale Adapter, Steuerung und deren Lebensdauer; keine Runde oder persistente Ergebnisse.
  create() {
    const room = selectedPlaygroundRoom(this.selection);

    this.room = room;
    this.scale.setGameSize(room.definition.width, room.definition.height);
    this.cameras.main.setSize(room.definition.width, room.definition.height);
    this.physics.world.setBounds(0, 0, room.definition.width, room.definition.height);
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
    this.audio = new GameAudio(this.sound);
    this.events.on('object-impact', this.audio.playObject, this.audio);
    this.activity = new PlayActivity(() => this.syncActivity());
    this.syncActivity();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.shutdown());
    this.diagnose(this.snapshot());
  }

  private syncActivity() {
    this.audio.setActive(this.activity.active);
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

    if (input.resetPressed) return void this.scene.restart({ selection: this.selection });
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
      this.audio.updateMovement(this.pixel.activity, this.pixel.snapshot());
    }

    this.diagnose(this.snapshot());
  }

  private damage(event: ChaosEvent | undefined) {
    if (!event || !this.chaos.awardEvent(event)) return;
    this.audio.playDamage(event);
    this.eventsLog = [...this.eventsLog.slice(-63), event];
  }

  // eslint-disable-next-line max-lines-per-function -- Nur losgelöste Diagnosewerte für die sichtbare DEV-Oberfläche, keine Engine-Referenzen oder Testsetter.
  snapshot() {
    return {
      generation: this.generation,
      variant: this.selection.id,
      mode: this.selection.mode,
      room: {
        id: this.room.definition.id,
        width: this.room.definition.width,
        height: this.room.definition.height,
      },
      kind: this.built.entries[0]?.definition.kind ?? 'room',
      score: this.chaos.score,
      events: [...this.eventsLog],
      object: this.built.entries[0]?.object.snapshot() ?? { state: 'empty' },
      objects: this.built.entries.map(({ definition, object }) => ({
        id: definition.id,
        variant: definition.variant,
        kind: definition.kind,
        state: object.snapshot(),
      })),
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
    this.events.off('object-impact', this.audio.playObject, this.audio);
    this.audio.destroy();
    this.controls.destroy();
    this.activity.destroy();
    this.pixel.destroy();

    for (const { object } of this.built.entries) object.destroy();

    for (const shelf of this.shelves) shelf.destroy();
  }
}
