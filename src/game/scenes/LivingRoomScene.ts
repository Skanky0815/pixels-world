import { onLanguageChange } from '../../i18n/locale';
import { MobileReadout } from '../ui/MobileReadout';
import { MainGoal } from '../domain/main-goal';
import { GoalView } from '../ui/GoalView';
import { StartScreen } from '../ui/StartScreen';
import { roundResult } from '../domain/round-result';
import { RoundResultView } from '../ui/RoundResultView';
import { Reconciliation } from '../domain/reconciliation';
import { ReconciliationView } from '../ui/ReconciliationView';
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
import { homecomingPositions } from '../content/homecoming-layout';
import { PixelReturnController } from '../domain/pixel-return';

export class LivingRoomScene extends Phaser.Scene {
  private mobile!: MobileReadout;
  private goal!: MainGoal;
  private goalView!: GoalView;
  private started = false;
  private startScreen!: StartScreen;
  private pixel!: Pixel;
  private round!: RoundController;
  private charm!: Reconciliation;
  private resultView!: RoundResultView;
  private charmView!: ReconciliationView;
  private homecoming!: HomecomingSequence;
  private sara!: SaraReturnView;
  private returning!: PixelReturnController;
  private returnTime = 0;
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
    this.charm = new Reconciliation();
    this.returnTime = 0;
    this.goal = new MainGoal(this.room.goal);
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
            started: this.started,
            intro: this.startScreen.snapshot(),
            goal: this.goal.snapshot(),
            goalView: this.goalView.snapshot(),
            round: this.round.snapshot(),
            homecoming: this.homecoming.snapshot(),
            reconciliation: this.charm.snapshot(),
            charmDisplay: this.charmView.snapshot(),
            result: this.resultView.snapshot(),
            pixelReturn: this.returning.snapshot(),
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
    this.initializeReturn();
  }

  private initializeReturn() {
    const { width, floor } = this.room.definition;
    const positions = homecomingPositions(width);

    this.returning = new PixelReturnController(
      { width, floorY: floor.y, targetX: positions.pixelSeatX },
      this.returnPlatforms(),
    );
  }

  private returnPlatforms() {
    return this.platforms.getChildren().map((platform) => {
      const bounds = (platform as Phaser.GameObjects.Rectangle).getBounds();

      return { left: bounds.left, right: bounds.right, top: bounds.top };
    });
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

  // eslint-disable-next-line max-lines-per-function -- Szeneneigene Ansichten und ihre gemeinsame Lebensdauer werden zusammen initialisiert.
  private initializeViews() {
    const room = this.room.definition;

    this.mobile = new MobileReadout();
    this.controls = new InputController(this);
    this.activity = new PlayActivity(() => this.syncActivity());
    this.hud = new GameHud(this, room.hud);
    this.sara = new SaraReturnView(this, { width: room.width, floorY: room.floor.y });
    this.charmView = new ReconciliationView(this, room.width, room.floor.y);
    this.resultView = new RoundResultView(this, room.width);
    this.startScreen = new StartScreen(!this.started, this.room.goal);
    this.goalView = new GoalView(this, this.room.goal);
    this.goalView.render(this.goal.snapshot(), this.started);
    this.syncActivity();
    const unsubscribe = onLanguageChange(() => this.refreshLanguage());

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, unsubscribe);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.shutdown());
  }

  // eslint-disable-next-line max-lines-per-function -- Alle szeneneigenen Ressourcen werden an derselben Lebensdauergrenze freigegeben.
  private shutdown() {
    for (const object of this.objects) object.destroy();
    this.activity.destroy();
    this.controls.destroy();
    this.pixel.destroy();
    this.hud.destroy();
    this.sara.destroy();
    this.charmView.destroy();
    this.resultView.destroy();
    this.startScreen.destroy();
    this.goalView.destroy();
    this.mobile.destroy();
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

  // eslint-disable-next-line max-lines-per-function -- Startsignal, Neustart und aktiver Frame werden in fester Reihenfolge mit derselben Eingabe behandelt.
  update(_time: number, delta: number) {
    if (!this.pixel) return;
    const input = this.controls.read(this.game.loop.frame);

    if (!this.started) {
      this.tryStart(input);

      return;
    }

    if (input.resetPressed) {
      this.scene.restart();

      return;
    }

    this.updateRound(input, delta);
    this.renderMobile();
  }

  // eslint-disable-next-line max-lines-per-function -- Nur Darstellungsdaten bestehender Ansichten; keine zweite Spielzustandsmaschine.
  private renderMobile() {
    this.controls.setActionLabel(
      this.started && this.round.snapshot().phase === 'chaos' ? 'Sprung' : 'Weiter',
    );
    this.mobile.render({
      hud: this.hud.snapshot(),
      goal: this.goalView.snapshot().text,
      homecoming: this.homecoming.snapshot().stage,
      dialogue: this.sara.snapshot().dialogueText,
      charmStage: this.charm.snapshot().stage,
      charm: this.charmView.readableText(),
      result: this.resultView.snapshot(),
      remaining: this.charm.snapshot().remainingMs / this.charm.snapshot().inputMs,
    });
  }

  private refreshLanguage() {
    this.renderHud(this.pixel.nearCurtain);
    this.sara.render(this.homecoming.snapshot(), this.returning.snapshot().stage === 'seated');
    this.charmView.render(this.charm.snapshot());
    this.renderResult();
    this.goalView.render(this.goal.snapshot(), this.started);

    this.renderMobile();
  }

  private tryStart(input: InputState) {
    if (!input.confirmPressed || !this.activity.active) return;
    this.started = true;
    this.startScreen.hide();
    this.goalView.render(this.goal.snapshot(), true);
    this.syncActivity();
  }

  private canPlay() {
    return this.started && this.activity.active && this.round.snapshot().phase === 'chaos';
  }

  private syncActivity() {
    const active = this.canPlay();

    if (!active) this.controls.release();
    this.setWorldActive(active);
    this.pixel.setPaused(!this.activity.active || !this.started);
    this.sara.setPaused(!this.activity.active);
    this.renderHud(this.pixel.nearCurtain);
  }

  private setWorldActive(active: boolean) {
    const returning = this.activity.active && this.returning.snapshot().stage === 'walking';

    if (active || returning) this.physics.world.resume();
    else this.physics.world.pause();

    if (active) this.tweens.resumeAll();
    else this.tweens.pauseAll();
  }

  private updateRound(input: InputState, delta: number) {
    const elapsed = this.activity.delta(delta);

    if (elapsed <= 0) return;

    if (this.canPlay()) this.playFrame(input, elapsed);
    else this.advanceHomecoming(input, elapsed);
  }

  private playFrame(input: InputState, elapsed: number) {
    const time = this.round.snapshot().elapsedMs;

    this.physics.world.update(time, elapsed);
    this.updateGameplay(input, time, elapsed);

    const reached = this.goal.advance(elapsed, this.pixel.snapshot(), input.active);

    this.goalView.render(this.goal.snapshot(), true);

    if (this.round.advance(elapsed, this.chaos.score, true, reached)) this.startHomecoming();
    else this.renderHud(this.pixel.nearCurtain);
  }

  private startHomecoming() {
    const score = this.round.snapshot().finalChaosScore;

    if (score === null) return;
    this.goal.finish(this.round.snapshot().endReason ?? 'timer');
    this.goalView.render(this.goal.snapshot(), true);
    this.homecoming.start(score);
    this.beginPixelReturn();
    this.sara.render(this.homecoming.snapshot());
    this.syncActivity();
  }

  private beginPixelReturn() {
    const pixelBody = this.pixel.collider.body;

    for (const body of this.physics.world.bodies.entries)
      if (body !== pixelBody) body.enable = false;
    this.returnTime = this.round.snapshot().elapsedMs;
    this.returning.start();
  }

  // eslint-disable-next-line max-lines-per-function -- Geordneter Übergang von Annäherung und Bestätigung zum Minispiel verwendet genau einen Frame-Input.
  private advanceHomecoming(input: InputState, elapsed: number) {
    if (this.homecoming.snapshot().stage === 'complete') {
      this.advanceCharm(input, elapsed);

      return;
    }

    this.homecoming.advance(elapsed);
    this.returnTime += elapsed;
    this.returnPixel(elapsed);

    if (input.confirmPressed && this.returning.snapshot().stage === 'seated')
      this.homecoming.confirm();
    this.syncHomecoming();
  }

  private returnPixel(elapsed: number) {
    const walking = this.returning.snapshot().stage === 'walking';
    const input = this.returning.input(this.pixel.contact);

    this.pixel.move(input, this.returnTime, elapsed, undefined);

    if (walking) this.physics.world.update(this.returnTime, elapsed);

    if (this.returning.snapshot().stage === 'seated') this.faceSara();
    this.pixel.present(this.returnTime, 'idle', false);

    if (walking && this.returning.snapshot().stage === 'seated') this.syncActivity();
  }

  private advanceCharm(input: InputState, elapsed: number) {
    this.charm.advance(elapsed);

    if (input.confirmPressed) this.charm.confirm();
    this.charm.input(input.arrows);
    this.charmView.render(this.charm.snapshot());
    this.renderResult();
  }

  private renderResult() {
    const result = roundResult(
      this.round.snapshot(),
      this.homecoming.snapshot(),
      this.charm.snapshot(),
    );

    this.resultView.render(result);
    this.controls.showRestart(result !== null);

    if (result) this.hud.showResult(result.outcome);
  }

  private faceSara() {
    this.pixel.faceToward(homecomingPositions(this.room.definition.width).saraEndX);
  }

  // eslint-disable-next-line max-lines-per-function -- Einmalige Phasenübergänge und ihre Ansichten werden atomar aus demselben Snapshot synchronisiert.
  private syncHomecoming() {
    const snapshot = this.homecoming.snapshot();

    if (snapshot.stage !== 'entering' && snapshot.stage !== 'waiting') this.round.startReaction();

    if (snapshot.stage === 'complete') {
      this.round.startReconciliation();
      this.charm.start(snapshot.selection?.score ?? 0);
      this.charmView.render(this.charm.snapshot());
    }

    this.sara.render(snapshot, this.returning.snapshot().stage === 'seated');
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
