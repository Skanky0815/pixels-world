import Phaser from 'phaser';
import { ASSETS } from '../assets/definitions';
import { spriteUrl } from '../assets/urls';
import type { InputState } from '../input/input-state';
import type { ResolvedRoom } from '../content/definitions';
import { buildObjects } from '../content/build-objects';
import { drawRoom } from '../content/draw-room';
import { Pixel } from '../actors/Pixel';
import { InputController } from '../input/InputController';
import { ChaosScore, angerFor } from '../domain/chaos';
import type { ChaosEvent } from '../domain/chaos-event';
import {
  overlaps,
  updateGroundInteractions,
  type Destructible,
  type Interactable,
  type InteractionContext,
  type ObjectLifecycle,
} from '../interactions/contracts';
import { Vase } from '../objects/Vase';
import { Couch } from '../objects/Couch';
import { Curtain } from '../objects/Curtain';
import { Plant } from '../objects/Plant';
import { RoundController } from '../domain/round-controller';
import { PlayActivity } from '../input/play-activity';
import { GameHud } from '../ui/GameHud';
import { HomecomingSequence } from '../domain/homecoming';
import { SaraReturnView } from '../ui/SaraReturnView';
import { roundConfigForPage } from '../input/round-profile';

export class LivingRoomScene extends Phaser.Scene {
  private pixel!: Pixel;
  private round!: RoundController;
  private homecoming!: HomecomingSequence;
  private sara!: SaraReturnView;
  private activity!: PlayActivity;
  private controls!: InputController;
  private generation = 0;
  private hud!: GameHud;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private readonly chaos = new ChaosScore();
  private couches: Couch[] = [];
  private curtains: Curtain[] = [];
  private plants: Plant[] = [];
  private built!: ReturnType<typeof buildObjects>;
  private vases: Vase[] = [];
  private objects: ObjectLifecycle[] = [];
  private groundObjects: Interactable[] = [];
  private climbables: Curtain[] = [];
  private destructibles: Destructible[] = [];

  constructor(private readonly room: ResolvedRoom) {
    super('LivingRoom');
  }

  preload() {
    this.preloadSprite(this.room.definition.pixelAsset);
    this.preloadSprite('sara');
  }

  private preloadSprite(key: 'pixel' | 'sara') {
    const asset = ASSETS[key];

    this.load.spritesheet(key, spriteUrl(key), {
      frameWidth: asset.frameWidth,
      frameHeight: asset.frameHeight,
    });
  }

  create() {
    const generation = ++this.generation;

    this.initializeRound();
    const floor = this.buildRoom();

    this.buildActors(floor);
    this.initializeInteractions();
    this.initializeViews();
    this.configureCamera();

    this.installObservation(generation);
  }

  private initializeRound() {
    this.physics.disableUpdate();
    this.chaos.reset();
    this.round = new RoundController(roundConfigForPage());
    this.homecoming = new HomecomingSequence();
  }

  private configureCamera() {
    const { width, height } = this.room.definition;

    this.cameras.main.setBounds(0, 0, width, height);
  }

  // eslint-disable-next-line max-lines-per-function -- Import und vollständiger nur lesbarer Snapshot bleiben unter derselben E2E-Buildbedingung; Produktionsisolation geht vor künstlichem Aufteilen.
  private installObservation(generation: number) {
    if (import.meta.env.MODE === 'e2e') {
      // eslint-disable-next-line max-lines-per-function -- Import und vollständiger nur lesbarer Snapshot bleiben unter derselben E2E-Buildbedingung; Produktionsisolation geht vor künstlichem Aufteilen.
      void import('../../test-observer').then(({ installTestObserver }) => {
        if (!this.scene.isActive() || this.generation !== generation) return;
        // eslint-disable-next-line max-lines-per-function -- Import und vollständiger nur lesbarer Snapshot bleiben unter derselben E2E-Buildbedingung; Produktionsisolation geht vor künstlichem Aufteilen.
        const removeObserver = installTestObserver(() => {
          const camera = this.cameras.main;

          return {
            ready: this.scene.isActive(),
            scene: this.scene.key,
            frame: this.game.loop.frame,
            generation,
            blurListeners: this.game.events.listenerCount(Phaser.Core.Events.BLUR),
            room: {
              id: this.room.definition.id,
              width: this.room.definition.width,
              height: this.room.definition.height,
            },
            objects: this.built.entries.map((entry) => ({
              id: entry.object.id,
              kind: entry.definition.kind,
              variant: entry.definition.variant,
              ...entry.object.damageSnapshot(),
            })),
            camera: {
              x: camera.scrollX,
              y: camera.scrollY,
              width: camera.width,
              height: camera.height,
              zoom: camera.zoom,
            },
            round: this.round.snapshot(),
            homecoming: this.homecoming.snapshot(),
            sara: this.sara.snapshot(),
            active: this.activity.active,
            chaos: {
              score: this.chaos.score,
              damagedObjects: this.chaos.count,
              anger: angerFor(this.chaos.score).id,
            },
            hud: this.hud.snapshot(),
            vases: this.vases.map((vase) => vase.snapshot()),
            couch: this.couches[0]?.snapshot() ?? null,
            curtain: this.curtains[0]?.snapshot() ?? null,
            plant: this.plants[0]?.snapshot() ?? null,
            pixel: this.pixel.snapshot(),
          };
        });

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, removeObserver);
      });
    }
  }

  private buildRoom() {
    const room = this.room.definition;

    drawRoom(this, room);
    this.platforms = this.physics.add.staticGroup();
    const floor = this.addPlatform(0, room.floor.y, room.width, room.height - room.floor.y);

    for (const { bounds: b } of room.platforms) this.addPlatform(b.x, b.y, b.width, b.height);

    return floor;
  }

  // eslint-disable-next-line max-lines-per-function -- Adapterregistrierung und Collider-Verdrahtung bleiben in ihrer notwendigen Aufbaufolge zusammen.
  private buildActors(floor: Phaser.GameObjects.Rectangle) {
    this.built = buildObjects(this, this.room);
    this.couches = this.built.couches;
    this.curtains = this.built.curtains;
    this.plants = this.built.plants;
    this.vases = this.built.vases;

    for (const couch of this.couches) this.platforms.add(couch.platform);
    this.pixel = new Pixel(this, this.room.spawn);
    this.physics.add.collider(this.pixel.collider, this.platforms);

    for (const vase of this.vases) this.connectVase(vase, floor);
  }

  private connectVase(vase: Vase, floor: Phaser.GameObjects.Rectangle) {
    this.physics.add.collider(vase.collider, this.platforms, (_object, surface) => {
      if (surface === floor) this.processDamage(vase.breakOnFloor());
    });
    this.physics.add.collider(this.pixel.collider, vase.collider, () => {
      const body = vase.collider.body as Phaser.Physics.Arcade.Body;

      if (body.touching.left || body.touching.right)
        vase.push(this.pixel.x < vase.collider.x ? 1 : -1);
    });
  }

  private initializeInteractions() {
    this.groundObjects = this.built.ground;
    this.climbables = this.curtains;
    this.destructibles = this.built.entries.map((entry) => entry.object);
    this.objects = this.built.entries.map((entry) => entry.object);

    for (const object of this.objects) object.reset();
  }

  private initializeViews() {
    const room = this.room.definition;

    this.controls = new InputController(this);
    this.activity = new PlayActivity(() => this.syncActivity());
    this.hud = new GameHud(this, room.hud);
    this.sara = new SaraReturnView(this, { width: room.width, floorY: room.floor.y });
    this.syncActivity();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.shutdown());
  }

  private shutdown() {
    for (const object of this.objects) object.destroy();
    this.activity.destroy();
    this.controls.destroy();
    this.pixel.destroy();
    this.hud.destroy();
    this.sara.destroy();
  }

  private addPlatform(x: number, y: number, width: number, height: number) {
    const surface = this.add.rectangle(x + width / 2, y + height / 2, width, height, 0, 0);

    this.physics.add.existing(surface, true);
    this.platforms.add(surface);

    return surface;
  }

  // eslint-disable-next-line max-lines-per-function -- Der flache HUD-Vertrag zeigt Score, Runde und Aktion gemeinsam; sämtliche Regeln bleiben außerhalb der Ansicht.
  private renderHud(nearCurtain: boolean) {
    const maximumScore = this.destructibles.reduce((sum, object) => sum + object.maximumScore, 0);

    this.hud.render({
      round: { ...this.round.snapshot(), paused: !this.activity.active },
      score: this.chaos.score,
      anger: angerFor(this.chaos.score),
      angerRatio: maximumScore > 0 ? this.chaos.score / maximumScore : 0,
      activity: this.pixel.activity,
      nearCurtain,
    });
  }

  private processDamage(event: ChaosEvent | undefined) {
    if (this.canPlay() && event && this.chaos.awardEvent(event))
      this.events.emit('object-damaged', event);
  }

  update(_time: number, delta: number) {
    if (!this.pixel) return;
    const input = this.controls.read(this.game.loop.frame);

    if (input.resetPressed) {
      this.scene.restart();

      return;
    }

    this.updateRound(input, delta);
  }

  private canPlay() {
    return this.activity.active && this.round.snapshot().phase === 'chaos';
  }

  private syncActivity() {
    const active = this.canPlay();

    if (!active) this.controls.release();
    this.setWorldActive(active);
    this.pixel.setPaused(!active);
    this.sara.setPaused(!this.activity.active);
    this.renderHud(this.pixel.nearCurtain);
  }

  private setWorldActive(active: boolean) {
    if (active) {
      this.physics.world.resume();
      this.tweens.resumeAll();
    } else {
      this.physics.world.pause();
      this.tweens.pauseAll();
    }
  }

  private updateRound(input: InputState, delta: number) {
    const elapsed = this.activity.delta(delta);

    if (elapsed <= 0) return;

    if (this.canPlay()) this.playFrame(input, elapsed);
    else this.advanceHomecoming(elapsed);
  }

  private playFrame(input: InputState, elapsed: number) {
    const time = this.round.snapshot().elapsedMs;

    this.physics.world.update(time, elapsed);
    this.updateGameplay(input, time, elapsed);

    if (this.round.advance(elapsed, this.chaos.score)) this.startHomecoming();
    else this.renderHud(this.pixel.nearCurtain);
  }

  private startHomecoming() {
    const score = this.round.snapshot().finalChaosScore;

    if (score === null) return;
    this.homecoming.start(score);
    this.sara.render(this.homecoming.snapshot());
    this.syncActivity();
  }

  private advanceHomecoming(elapsed: number) {
    this.homecoming.advance(elapsed);
    const snapshot = this.homecoming.snapshot();

    if (snapshot.stage !== 'entering' && snapshot.stage !== 'waiting') this.round.startReaction();

    if (snapshot.stage === 'complete') this.round.startReconciliation();
    this.sara.render(snapshot);
    this.renderHud(this.pixel.nearCurtain);
  }

  // eslint-disable-next-line max-lines-per-function -- Die fachlich festgelegte Frame-Reihenfolge verwendet denselben Input und Snapshot; Bodenaktionen sind separat.
  private updateGameplay(input: InputState, time: number, delta: number) {
    for (const vase of this.vases) vase.updateFall();
    const before = this.pixel.snapshot();
    const surface = this.climbables.find((object) => overlaps(before, object.climbArea));

    this.pixel.move(input, time, delta, surface?.climbArea);
    const context: InteractionContext = Object.freeze({
      time,
      delta,
      input,
      pixel: Object.freeze(this.pixel.snapshot()),
    });

    for (const object of this.climbables)
      this.processDamage(object.updateClimb(context, object === surface && context.pixel.climbing));
    this.updateGround(context, surface);
  }

  private updateGround(context: InteractionContext, surface: Curtain | undefined) {
    const interaction = updateGroundInteractions(this.groundObjects, context);

    this.processDamage(interaction.event);

    if (interaction.faceX !== undefined) this.pixel.faceToward(interaction.faceX);
    this.pixel.present(context.time, interaction.action, surface?.snapshot().state === 'sliding');
  }
}
