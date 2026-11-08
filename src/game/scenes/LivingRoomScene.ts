import { preloadCarpetArt } from '../assets/carpet-art';
import { albumCollection } from '../../settings/album';
import { discoverAlbum } from '../../content/album';
import type { AlbumDiscovery } from '../../content/album/discovery';
import { preloadPictureArt } from '../assets/picture-art';
import { preloadBookArt } from '../assets/book-art';
import { preloadRoomArt } from '../assets/room-art';
import { preloadShelfArt } from '../assets/shelf-art';
import type { Shelf } from '../objects/Shelf';
import { preloadFavoriteBallArt } from '../assets/favorite-ball-art';
import { preloadCatgrassArt } from '../assets/catgrass-art';
import { preloadCurtainArt } from '../assets/curtain-art';
import { preloadCouchArt } from '../assets/couch-art';
import { preloadVaseArt } from '../assets/vase-art';
import { difficultyPreferences } from '../../settings/difficulty';
import { difficultyRoom, difficultyTimer, type Difficulty } from '../../content/difficulty';
import { populateSpawnSlots } from '../content/spawn-slots';
import { resolveRoom } from '../content/resolve-room';
import { OBJECTS } from '../../content/objects/catalog';
import { GameFeedback } from '../ui/GameFeedback';
import { PauseMenu } from '../ui/PauseMenu';
import { GameAudio } from '../ui/GameAudio';
import type { DebugScenario } from '../../dev/game-debug-model';
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
import {
  createRoomPhysics,
  connectObjectPhysics,
  advanceObjectInteractions,
} from '../content/object-playfield';
import { Pixel } from '../actors/Pixel';
import { InputController } from '../input/InputController';
import { ChaosScore, angerFor } from '../domain/chaos';
import type { ChaosEvent } from '../domain/chaos-event';
import type { Destructible, ObjectLifecycle } from '../interactions/contracts';
import { Vase } from '../objects/Vase';
import { Couch } from '../objects/Couch';
import { Curtain } from '../objects/Curtain';
import { Plant } from '../objects/Plant';
import { ROUND_CONFIG, RoundController } from '../domain/round-controller';
import { PlayActivity } from '../input/play-activity';
import { GameHud } from '../ui/GameHud';
import { HomecomingSequence } from '../domain/homecoming';
import { SaraReturnView } from '../ui/SaraReturnView';
import { roundConfigForPage } from '../input/round-profile';
import { homecomingPositions } from '../content/homecoming-layout';
import { PixelReturnController } from '../domain/pixel-return';

export class LivingRoomScene extends Phaser.Scene {
  private mobile!: MobileReadout;
  private menu!: PauseMenu;
  private audio!: GameAudio;
  private feedback!: GameFeedback;
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
  private random: (() => number) | undefined;
  private hud!: GameHud;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private readonly chaos = new ChaosScore();
  private couches: Couch[] = [];
  private curtains: Curtain[] = [];
  private plants: Plant[] = [];
  private built!: ReturnType<typeof buildObjects>;
  private vases: Vase[] = [];
  private objects: ObjectLifecycle[] = [];
  private shelves: Shelf[] = [];
  private lastAlbumDiscovery: AlbumDiscovery | null = null;
  private destructibles: Destructible[] = [];

  private room: ResolvedRoom;
  private readonly populationSeed = String(Phaser.Math.Between(0, 0x7fffffff));
  private difficulty: Difficulty = 'normal';

  constructor(private readonly baseRoom: ResolvedRoom) {
    super('LivingRoom');
    this.room = baseRoom;
  }

  // eslint-disable-next-line max-lines-per-function -- Zusammengehöriger Asset-Aufbau bzw. vollständiger Geometrie- und Szenariotest bleibt als ein Ablauf lesbar.
  preload() {
    preloadVaseArt(this);
    preloadCarpetArt(this);
    preloadPictureArt(this);
    preloadBookArt(this);
    preloadShelfArt(this);
    preloadRoomArt(this);
    preloadCouchArt(this);
    preloadCurtainArt(this);
    preloadCatgrassArt(this);
    preloadFavoriteBallArt(this);
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

  // eslint-disable-next-line max-lines-per-function -- Raum, Figuren und szenengebundene Diagnose werden in fester Aufbaufolge initialisiert.
  create(data: { debugScenario?: DebugScenario; started?: boolean } = {}) {
    const generation = ++this.generation;

    this.difficulty = difficultyPreferences.snapshot();
    this.started = data.started ?? this.started;
    this.room = this.populateRoom();

    this.initializeRound();
    const floor = this.buildRoom();

    this.buildActors(floor);
    this.initializeInteractions();
    this.initializeViews();
    this.configureCamera();

    this.installObservation(generation);

    if (import.meta.env.DEV) this.installDebug(generation, data.debugScenario);
  }

  // eslint-disable-next-line max-lines-per-function -- Raumseed, Schwierigkeit und isolierter Phaser-Zufall werden gemeinsam beim Rundenaufbau aufgelöst.
  private populateRoom() {
    const seed =
      import.meta.env.DEV || import.meta.env.MODE === 'e2e'
        ? (new URLSearchParams(location.search).get('room-seed') ?? this.populationSeed)
        : this.populationSeed;
    const random = new Phaser.Math.RandomDataGenerator([seed]);
    const room = difficultyRoom(this.baseRoom.definition, this.difficulty);

    return resolveRoom(
      populateSpawnSlots(room, OBJECTS, this.difficulty, () => random.frac()),
      OBJECTS,
    );
  }

  private initializeRound() {
    this.physics.disableUpdate();
    this.chaos.reset();
    this.random = undefined;
    this.round = this.createRound();
    this.homecoming = new HomecomingSequence();
    this.charm = new Reconciliation(this.random);
    this.returnTime = 0;
    this.goal = new MainGoal(this.room.goal);
  }

  private createRound() {
    const config = difficultyTimer(roundConfigForPage() ?? ROUND_CONFIG, this.difficulty);

    return new RoundController(config, this.random);
  }

  private configureCamera() {
    const { width, height } = this.room.definition;

    this.cameras.main.setBounds(0, 0, width, height);
  }

  // eslint-disable-next-line max-lines-per-function -- Der vollständige DEV-Port bleibt innerhalb der Build-Grenze; weder Aktionen noch Engine-Referenzen werden global exponiert.
  private installDebug(generation: number, scenario?: DebugScenario) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line max-lines-per-function -- Asynchrone Installation prüft die Szenengeneration und bindet alle Debug-Ressourcen an deren Shutdown.
      void import('../../dev/game-debug').then(({ installGameDebug }) => {
        if (!this.scene.isActive() || this.generation !== generation) return;
        const models = () => ({
          round: this.round,
          homecoming: this.homecoming,
          charm: this.charm,
        });
        const destroy = installGameDebug(
          this,
          {
            get round() {
              return models().round;
            },
            get homecoming() {
              return models().homecoming;
            },
            get charm() {
              return models().charm;
            },
            configure: (config, random) => {
              this.random = random;
              this.round = new RoundController(
                { minDurationMs: config.seconds * 1000, maxDurationMs: config.seconds * 1000 },
                random,
              );
              this.charm = new Reconciliation(random);
              this.chaos.award('dev-scenario', config.score);
              this.startRound();
            },
            restart: (config) => this.scene.restart({ debugScenario: config }),
            startHomecoming: () => {
              if (this.round.advance(this.round.snapshot().returnAtMs, this.chaos.score))
                this.startHomecoming();
            },
            sync: () => {
              this.syncHomecoming();
              this.charmView.render(this.charm.snapshot());
              this.renderResult();
              this.renderMobile();
            },
            forward: () => {
              if (this.canPlay() && this.round.advance(10_000, this.chaos.score))
                this.startHomecoming();
              this.renderHud();
            },
            release: () => this.controls.release(),

            // eslint-disable-next-line max-lines-per-function -- Vollständiger losgelöster DEV-Diagnosevertrag ohne Engine-Referenzen.
            read: () => ({
              generation,
              started: this.started,
              active: this.activity.active,
              audio: this.audio.snapshot(),
              feedback: this.feedback.snapshot(),
              round: this.round.snapshot(),
              chaos: { score: this.chaos.score, anger: angerFor(this.chaos.score).id },
              homecoming: this.homecoming.snapshot(),
              reconciliation: this.charm.snapshot(),
              pixelReturn: this.returning.snapshot(),
              pixel: this.pixel.snapshot(),
              blurListeners: this.game.events.listenerCount(Phaser.Core.Events.BLUR),
            }),
          },
          scenario,
        );

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, destroy);
      });
    }
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
            difficulty: this.difficulty,
            scene: this.scene.key,
            frame: this.game.loop.frame,
            generation,
            blurListeners: this.game.events.listenerCount(Phaser.Core.Events.BLUR),
            room: {
              id: this.room.definition.id,
              width: this.room.definition.width,
              height: this.room.definition.height,
            },
            wallPlacements: this.room.definition.wallPlacements ?? [],
            shelves: this.shelves.map((shelf) => shelf.snapshot()),
            albumDiscovery: this.lastAlbumDiscovery,
            carpets: this.built.carpets.map((carpet) => carpet.snapshot()),
            pictures: this.built.pictures.map((picture) => picture.snapshot()),
            books: this.built.books.map((books) => books.snapshot()),
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
            audio: this.audio.snapshot(),
            feedback: this.feedback.snapshot(),
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
    const { platforms, floor, shelves } = createRoomPhysics(this, this.room.definition);

    this.shelves = shelves;

    this.platforms = platforms;

    return floor;
  }

  // eslint-disable-next-line max-lines-per-function -- Adapterregistrierung und Collider-Verdrahtung bleiben in ihrer notwendigen Aufbaufolge zusammen.
  private buildActors(floor: Phaser.GameObjects.Rectangle) {
    this.built = buildObjects(this, this.room);
    this.couches = this.built.couches;
    this.curtains = this.built.curtains;
    this.plants = this.built.plants;
    this.vases = this.built.vases;

    this.pixel = new Pixel(this, this.room.spawn);
    connectObjectPhysics(this, this.built, this.pixel, this.platforms, floor, (event) =>
      this.processDamage(event),
    );
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

  // Nur noch aktive Körper liefern die Plattformgeometrie für Pixels automatische Rückkehr.
  private returnPlatforms() {
    return this.platforms
      .getChildren()
      .filter(activePlatform)
      .map((platform) => {
        const bounds = (platform as Phaser.GameObjects.Rectangle).getBounds();

        return { left: bounds.left, right: bounds.right, top: bounds.top };
      });
  }

  private initializeInteractions() {
    this.lastAlbumDiscovery = null;
    this.destructibles = this.built.entries.map((entry) => entry.object);
    this.objects = this.built.entries.map((entry) => entry.object);

    for (const object of this.objects) object.reset();
  }

  // eslint-disable-next-line max-lines-per-function -- Szeneneigene Ansichten und ihre gemeinsame Lebensdauer werden zusammen initialisiert.
  private initializeViews() {
    const room = this.room.definition;

    this.mobile = new MobileReadout();
    this.feedback = new GameFeedback(this);
    this.controls = new InputController(this);
    this.activity = new PlayActivity(() => this.syncActivity());
    this.audio = new GameAudio(this.sound);
    this.hud = new GameHud(this);
    this.sara = new SaraReturnView(this, {
      width: room.width,
      floorY: room.floor.y,
      backgroundDoor: room.decorations.some((d) => d.kind === 'image' && d.asset === 'room-door'),
    });
    this.charmView = new ReconciliationView(this, room.width, room.floor.y);
    this.resultView = new RoundResultView(this, room.width);
    this.startScreen = new StartScreen(
      !this.started,
      this.room.goal,
      () => this.menu.open(),
      () => this.menu.openAlbum(),
    );
    this.goalView = new GoalView(this, this.room.goal, this.difficulty);
    this.goalView.render(this.goal.snapshot(), this.started);
    this.menu = new PauseMenu({
      pause: (paused) => {
        this.controls.release();
        this.activity.setPaused(paused);
      },
      restart: () => this.scene.restart({}),
      started: () => this.started,
      difficulty: () => this.difficulty,
    });
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
    this.menu.destroy();
    this.audio.destroy();
    this.feedback.destroy();
  }

  private renderHud() {
    this.hud.render({ score: this.chaos.score, difficulty: this.difficulty });
  }

  private processDamage(event: ChaosEvent | undefined) {
    if (!this.canPlay() || !event || !this.chaos.awardEvent(event)) return;
    this.events.emit('object-damaged', event);
    this.discoverAlbum(event);
  }

  private discoverAlbum(event: ChaosEvent) {
    const entry = this.built.entries.find((e) => e.object.id === event.objectId);

    if (!entry) return;
    const discovery = discoverAlbum(event, entry.definition.variant);

    if (!discovery) return;
    albumCollection.unlock(discovery.entryId);
    this.lastAlbumDiscovery = discovery;
    this.events.emit('album-discovered', discovery);
  }

  // eslint-disable-next-line max-lines-per-function -- Startsignal, Neustart und aktiver Frame werden in fester Reihenfolge mit derselben Eingabe behandelt.
  update(_time: number, delta: number) {
    if (!this.pixel) return;
    const input = this.controls.read(this.game.loop.frame);

    if (this.menu.opened) return;

    if (!this.started) {
      this.tryStart(input);

      return;
    }

    if (input.resetPressed) {
      this.scene.restart({});

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
      started: this.started,
      hud: this.hud.snapshot(),
      feedback: this.feedback.readable(),
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
    this.renderHud();
    this.sara.render(this.homecoming.snapshot(), this.returning.snapshot().stage === 'seated');
    this.charmView.render(this.charm.snapshot());
    this.renderResult();
    this.goalView.render(this.goal.snapshot(), this.started);

    this.renderMobile();
  }

  private tryStart(input: InputState) {
    if (!input.confirmPressed || !this.activity.active) return;
    const selected = difficultyPreferences.snapshot();

    if (selected !== this.difficulty) {
      this.scene.restart({ started: true });

      return;
    }

    this.startRound();
  }

  private startRound() {
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
    this.audio.setActive(this.activity.active && this.started);
    this.renderHud();
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

    if (elapsed <= 0) return this.deferInput(input);

    if (input.confirmPressed && this.resultView.snapshot()) return this.scene.restart({});

    if (this.canPlay()) this.playFrame(input, elapsed);
    else this.advanceHomecoming(input, elapsed);
    this.presentFeedback(elapsed);
  }

  private deferInput(input: InputState) {
    if (this.activity.active) this.controls.defer(input);
  }

  private presentFeedback(elapsed: number) {
    this.feedback.advance(elapsed, {
      started: this.started,
      round: this.round.snapshot(),
      charm: this.charm.snapshot(),
      outcome: this.resultView.snapshot()?.outcome ?? null,
    });
  }

  private playFrame(input: InputState, elapsed: number) {
    const time = this.round.snapshot().elapsedMs;

    this.physics.world.update(time, elapsed);
    this.updateGameplay(input, time, elapsed);

    const reached = this.goal.advance(elapsed, this.pixel.snapshot(), input.active);

    this.goalView.render(this.goal.snapshot(), true);

    if (this.round.advance(elapsed, this.chaos.score, true, reached)) this.startHomecoming();
    else this.renderHud();
  }

  private startHomecoming() {
    const score = this.round.snapshot().finalChaosScore;

    if (score === null) return;
    this.goal.finish(this.round.snapshot().endReason ?? 'timer');
    this.goalView.render(this.goal.snapshot(), true);
    this.homecoming.start(score, this.random);
    this.beginPixelReturn();
    this.sara.render(this.homecoming.snapshot());
    this.syncActivity();
  }

  private beginPixelReturn() {
    const pixelBody = this.pixel.collider.body;

    for (const body of this.physics.world.bodies.entries)
      if (body !== pixelBody) body.enable = false;
    this.returnTime = this.round.snapshot().elapsedMs;
    this.initializeReturn();
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
      this.charm.start(snapshot.selection?.score ?? 0, this.difficulty);
      this.charmView.render(this.charm.snapshot());
    }

    this.sara.render(snapshot, this.returning.snapshot().stage === 'seated');
    this.renderHud();
  }

  // eslint-disable-next-line max-lines-per-function -- Der gemeinsame Frame-Schritt erhält seine expliziten Adapter, Eingaben und Schadensrückgabe.
  private updateGameplay(input: InputState, time: number, delta: number) {
    advanceObjectInteractions(
      this.built,
      this.pixel,
      input,
      time,
      delta,
      (event) => this.processDamage(event),
      this.shelves,
    );
  }
}

function activePlatform(platform: Phaser.GameObjects.GameObject) {
  const body = (platform as Phaser.GameObjects.Rectangle)
    .body as Phaser.Physics.Arcade.StaticBody | null;

  return Boolean(body?.enable);
}
