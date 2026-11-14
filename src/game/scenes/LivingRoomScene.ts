import { AlbumBanners } from '../ui/AlbumBanners';
import { EndingPresentation } from '../domain/ending-presentation';
import { preloadSaraEndingArt } from '../assets/sara-ending-art';
import { installFollowCamera } from '../follow-camera-preview';
import { loadingScreen } from '../../loading-screen';
import { preloadObjectAudio } from '../assets/object-audio';
import { preloadDialoguePortraits, DIALOGUE_PORTRAITS } from '../assets/dialogue-portraits';
import { BallPlay, ballPlayPose, ballPlayPlacement } from '../domain/ball-play';
import { motionPreferences } from '../../settings/motion';
import { preloadCarpetArt } from '../assets/carpet-art';
import { albumCollection } from '../../settings/album';
import { RoundAlbum } from '../album/round';
import { discoverAlbum, INTERACTABLE_ALBUM } from '../../content/album';
import type { AlbumDiscovery } from '../../content/album/discovery';
import { preloadPictureArt } from '../assets/picture-art';
import { preloadBookArt } from '../assets/book-art';
import { preloadKitchenArt } from '../assets/kitchen-art';
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
import { onLanguageChange, copy, translateExact } from '../../i18n/locale';
import { PeacefulGoal } from '../domain/peaceful-goal';
import type { PeacefulGoalLine } from '../../content/peaceful-goal';
import { MobileReadout } from '../ui/MobileReadout';
import { MainGoal } from '../domain/main-goal';
import { GoalView } from '../ui/GoalView';
import { StartScreen } from '../ui/StartScreen';
import { roundResult } from '../domain/round-result';
import { RoundResultView } from '../ui/RoundResultView';
import { Reconciliation } from '../domain/reconciliation';
import { CharmPresentation } from '../domain/charm-presentation';
import { preloadCharmArt } from '../assets/charm-art';
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
import { DialogueMemory } from '../domain/sara-dialogue';
import { ReactionDamage } from '../domain/reaction-damage';
import { SaraReturnView } from '../ui/SaraReturnView';
import { roundConfigForPage } from '../input/round-profile';
import { homecomingPositions, homecomingCharmPose } from '../content/homecoming-layout';
import { PixelReturnController } from '../domain/pixel-return';
import { RoomSelection } from '../ui/RoomSelection';
import { playableRoom } from '../../content/rooms/selection';

export class LivingRoomScene extends Phaser.Scene {
  private mobile!: MobileReadout;
  private menu!: PauseMenu;
  private audio!: GameAudio;
  private feedback!: GameFeedback;
  private goal!: MainGoal;
  private goalView!: GoalView;
  private ballPlay = new BallPlay();
  private ballPlayLayout!: ReturnType<typeof ballPlayPlacement>;
  private ballPlayOrigin = 0;
  private ballPlayVisualX = 0;
  private started = false;
  private startScreen!: StartScreen;
  private roomSelection!: RoomSelection;
  private choosingRoom: boolean;
  private menuHome: boolean;
  private pixel!: Pixel;
  private round!: RoundController;
  private charm!: Reconciliation;
  private charmPresentation!: CharmPresentation;
  private ending = new EndingPresentation();
  private albumBanners!: AlbumBanners;
  private resultView!: RoundResultView;
  private charmView!: ReconciliationView;
  private homecoming!: HomecomingSequence;
  private readonly dialogueMemory = new DialogueMemory();
  private peacefulGoal = new PeacefulGoal();
  private readonly previousPeaceful = new Map<string, PeacefulGoalLine>();
  private readonly reactionDamage = new ReactionDamage();
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
  private roundAlbum = new RoundAlbum(albumCollection);
  private destructibles: Destructible[] = [];

  private room: ResolvedRoom;
  private readonly populationSeed = String(Phaser.Math.Between(0, 0x7fffffff));
  private difficulty: Difficulty = 'normal';

  constructor(private baseRoom: ResolvedRoom) {
    super('LivingRoom');
    this.room = baseRoom;
    this.choosingRoom = new URLSearchParams(location.search).get('room') !== baseRoom.definition.id;
    this.menuHome = this.choosingRoom;
  }

  // eslint-disable-next-line max-lines-per-function -- Zusammengehöriger Asset-Aufbau bzw. vollständiger Geometrie- und Szenariotest bleibt als ein Ablauf lesbar.
  preload() {
    loadingScreen.track(this.load, Object.keys(DIALOGUE_PORTRAITS));
    preloadObjectAudio(this);
    preloadCharmArt(this);
    preloadSaraEndingArt(this);
    preloadDialoguePortraits(this);
    preloadVaseArt(this);
    preloadCarpetArt(this);
    preloadPictureArt(this);
    preloadBookArt(this);
    preloadShelfArt(this);
    preloadRoomArt(this);

    if (this.room.definition.environment === 'kitchen-preview') preloadKitchenArt(this);
    preloadCouchArt(this);
    preloadCurtainArt(this);
    preloadCatgrassArt(this);
    preloadFavoriteBallArt(this);
    this.preloadSprite(this.room.definition.pixelAsset);
    this.preloadSprite('sara');
  }

  private isReady() {
    return this.scene.isActive() && !loadingScreen.blocking;
  }

  private preloadSprite(key: 'pixel' | 'sara') {
    const asset = ASSETS[key];

    this.load.spritesheet(key, spriteUrl(key), {
      frameWidth: asset.frameWidth,
      frameHeight: asset.frameHeight,
    });
  }

  // eslint-disable-next-line max-lines-per-function -- Raum, Figuren und szenengebundene Diagnose werden in fester Aufbaufolge initialisiert.
  create(
    data: {
      debugScenario?: DebugScenario;
      started?: boolean;
      chooseRoom?: boolean;
      menuHome?: boolean;
      roomId?: string;
    } = {},
  ) {
    if (loadingScreen.failed) return;
    this.events.once(Phaser.Scenes.Events.RENDER, () =>
      loadingScreen.ready(() => {
        this.controls.release();
        this.roomSelection.enable();
        this.menu.enable();
      }),
    );
    const generation = ++this.generation;

    this.difficulty = difficultyPreferences.snapshot();
    this.started = data.started ?? this.started;
    this.choosingRoom = data.chooseRoom ?? this.choosingRoom;
    this.menuHome = data.menuHome ?? this.menuHome;
    this.changeRoom(data.roomId);
    this.room = this.populateRoom();
    this.refreshCaption();

    this.initializeRound();
    const floor = this.buildRoom();

    this.buildActors(floor);
    this.initializeInteractions();
    this.initializeViews();
    this.configureCamera();

    this.installObservation(generation);

    if (import.meta.env.DEV) this.installDebug(generation, data.debugScenario);
  }

  private changeRoom(id?: string) {
    const definition = id ? playableRoom(id) : undefined;

    if (definition) this.baseRoom = resolveRoom(definition, OBJECTS);
  }

  private refreshCaption() {
    const caption = document.querySelector('h1 span');

    if (caption) caption.textContent = translateExact(this.room.definition.caption);
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

  // eslint-disable-next-line max-lines-per-function -- Die neuen Rundenmodelle teilen denselben Aufbau, während nur die Dialogerinnerung über Szenenneustarts erhalten bleibt.
  private initializeRound() {
    this.physics.disableUpdate();
    this.chaos.reset();
    this.roundAlbum = new RoundAlbum(albumCollection);
    this.peacefulGoal = new PeacefulGoal();
    this.reactionDamage.reset();
    this.random = undefined;
    this.round = this.createRound();
    this.homecoming = new HomecomingSequence({
      roomId: this.room.definition.id,
      memory: this.dialogueMemory,
    });
    this.charm = new Reconciliation(this.random);
    this.charmPresentation = new CharmPresentation();
    this.ending = new EndingPresentation();
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
    installFollowCamera(this, this.pixel.collider);
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
            // eslint-disable-next-line max-lines-per-function -- Ein explizites DEV-Szenario beginnt ohne Dialoghistorie, damit identische Seeds reproduzierbar bleiben.
            configure: (config, random) => {
              this.dialogueMemory.clear();
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
            ready: this.isReady(),
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
            album: this.roundAlbum.snapshot(),
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
            ballPlay: this.ballPlay.snapshot(),
            goalView: this.goalView.snapshot(),
            round: this.round.snapshot(),
            homecoming: this.homecoming.snapshot(),
            reconciliation: this.charm.snapshot(),
            charmDisplay: this.charmView.snapshot(),
            charmMotion: this.charmPresentation.snapshot(),
            ending: this.ending.snapshot(),
            objectImpacts: this.built.impacts.snapshot(),
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
    const positions = homecomingPositions(width, this.room.definition.homecomingSide);

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

    this.ballPlay = new BallPlay();
    this.mobile = new MobileReadout();
    this.feedback = new GameFeedback(this);
    this.controls = new InputController(this);
    this.activity = new PlayActivity(() => this.syncActivity());
    this.audio = new GameAudio(this.sound);
    this.events.on('object-impact', this.audio.playObject, this.audio);
    this.hud = new GameHud(this);
    this.sara = new SaraReturnView(this, {
      width: room.width,
      floorY: room.floor.y,
      entrySide: room.homecomingSide,
      backgroundDoor: room.decorations.some((d) => d.kind === 'image' && d.asset === 'room-door'),
    });
    this.charmView = new ReconciliationView(this, room.width, room.floor.y, room.homecomingSide);
    this.albumBanners = new AlbumBanners();
    this.resultView = new RoundResultView(this, room.width);
    this.startScreen = new StartScreen(!this.started && !this.choosingRoom, this.room.goal, () =>
      this.returnToRooms(),
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
      rooms: () => this.returnToRooms(),
      play: () => this.openRooms(),
    });
    this.roomSelection = new RoomSelection(
      this.choosingRoom,
      (id) => this.chooseRoom(id),
      () => this.returnToRooms(),
      () => this.menu.open(),
    );
    this.syncActivity();

    if (this.menuHome && !this.started) this.menu.open(true);
    const unsubscribe = onLanguageChange(() => this.refreshLanguage());
    const unsubscribeMotion = motionPreferences.subscribe(() => {
      if (this.ballPlay.snapshot().active) this.renderBallPlay();

      if (this.round.snapshot().phase === 'reconciliation') this.renderCharmMotion();
      this.presentEnding();
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, unsubscribeMotion);

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
    this.albumBanners.destroy();
    this.startScreen.destroy();
    this.roomSelection.destroy();
    this.goalView.destroy();
    this.mobile.destroy();
    this.menu.destroy();
    this.events.off('object-impact', this.audio.playObject, this.audio);
    this.audio.destroy();
    this.feedback.destroy();
  }

  private renderHud() {
    this.hud.render({ score: this.chaos.score });
  }

  private processDamage(event: ChaosEvent | undefined) {
    if (!this.canPlay() || !event || !this.chaos.awardEvent(event)) return;
    this.reactionDamage.record(event, this.damagedObjectKind(event.objectId));
    this.recordDestruction(event);
    this.audio.playDamage(event);
    this.events.emit('object-damaged', event);
    this.discoverAlbum(event);
  }

  private damagedObjectKind(objectId: string) {
    const entry = this.built.entries.find((entry) => entry.object.id === objectId);

    if (entry) return entry.definition.kind;

    return this.shelves.some((shelf) => shelf.id === objectId) ? 'shelf' : undefined;
  }

  private recordDestruction(event: ChaosEvent) {
    this.roundAlbum.recordDamage(
      event,
      this.damagedObjectKind(event.objectId),
      this.damagedVariant(event.objectId),
    );
  }

  private damagedVariant(objectId: string) {
    const entry = this.built.entries.find((entry) => entry.object.id === objectId);

    if (entry) {
      const variant = INTERACTABLE_ALBUM[entry.definition.variant];

      return variant?.previewOnly ? undefined : variant?.id;
    }

    const shelf = this.shelves.find((shelf) => shelf.id === objectId);

    return shelf ? `shelf.${shelf.snapshot().stability}` : undefined;
  }

  private discoverAlbum(event: ChaosEvent) {
    const entry = this.built.entries.find((e) => e.object.id === event.objectId);

    if (!entry) return;
    const discovery = discoverAlbum(event, entry.definition.variant);

    if (!discovery) return;
    this.roundAlbum.record(discovery.entryId);
    this.lastAlbumDiscovery = discovery;
    this.events.emit('album-discovered', discovery);
  }

  // eslint-disable-next-line max-lines-per-function -- Startsignal, Neustart und aktiver Frame werden in fester Reihenfolge mit derselben Eingabe behandelt.
  update(_time: number, delta: number) {
    if (!this.pixel) return;

    if (loadingScreen.blocking) return void this.controls.release();
    const input = this.controls.read(this.game.loop.frame);

    if (this.menu.opened) return;

    if (this.roomSelection.opened) return void this.controls.release();

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

  private returnToRooms() {
    this.scene.restart({ started: false, chooseRoom: true, menuHome: false });
  }

  private openRooms() {
    this.menuHome = false;
    this.choosingRoom = true;
    this.roomSelection.setVisible(true);
    this.startScreen.hide();
    this.controls.release();
    document.querySelector<HTMLButtonElement>('[data-room-start]')?.focus();
  }

  private chooseRoom(id: string) {
    this.menuHome = false;

    if (id !== this.baseRoom.definition.id)
      return void this.scene.restart({ started: false, chooseRoom: false, roomId: id });
    this.choosingRoom = false;
    this.roomSelection.setVisible(false);
    this.startScreen.show();
    this.controls.release();
    document.getElementById('game')?.focus();
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
      homecoming:
        this.peacefulGoal.snapshot().line && this.ballPlay.snapshot().active
          ? 'dialogue'
          : this.homecoming.snapshot().stage,
      dialogue: this.sara.snapshot().dialogueText,
      portrait: this.sara.portraitId(),
      welcome: this.ballPlay.snapshot().active && !!this.peacefulGoal.snapshot().line,
      charmStage: this.charm.snapshot().stage,
      charm: this.charmView.readableText(),
      result: this.resultView.snapshot(),
      remaining: this.charm.snapshot().remainingMs / this.charm.snapshot().inputMs,
    });
  }

  private refreshLanguage() {
    this.refreshCaption();
    this.renderHud();
    this.renderSara();
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
    this.menu.dismiss();
    this.started = true;
    this.choosingRoom = false;
    this.roomSelection.setVisible(false);
    this.startScreen.hide();
    this.roomSelection.showReturn(false);
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
    this.audio.setActive(this.activity.active && this.started && !this.ballPlay.snapshot().active);
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

    if (this.ballPlay.snapshot().active) this.advanceBallPlay(elapsed);
    else if (this.canPlay()) this.playFrame(input, elapsed);
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
      peaceful: this.resultView.snapshot()?.peaceful,
    });
  }

  private playFrame(input: InputState, elapsed: number) {
    const time = this.round.snapshot().elapsedMs;

    this.physics.world.update(time, elapsed);
    this.updateGameplay(input, time, elapsed);
    this.audio.updateMovement(this.pixel.activity, this.pixel.snapshot());

    const reached = this.goal.advance(elapsed, this.pixel.snapshot(), input.active);

    this.goalView.render(this.goal.snapshot(), true);

    if (this.round.advance(elapsed, this.chaos.score, true, reached)) this.finishRound();
    else this.renderHud();
  }

  private finishRound() {
    this.goal.finish(this.round.snapshot().endReason ?? 'timer');
    this.beginPeacefulGoal();

    if (this.round.snapshot().endReason === 'goal') this.beginBallPlay();
    else this.startHomecoming();
  }

  // eslint-disable-next-line max-lines-per-function -- Einmaliger Trigger, raumbezogene Erinnerung und sofortige Darstellung bleiben gemeinsam sichtbar.
  private beginPeacefulGoal() {
    const key = `${this.room.definition.id}/${this.room.goal.id}`;

    if (
      !this.peacefulGoal.start(
        this.round.snapshot(),
        this.chaos.count,
        this.random,
        this.previousPeaceful.get(key),
      )
    )
      return;
    const line = this.peacefulGoal.snapshot().line;

    if (line) this.previousPeaceful.set(key, line);
    this.renderSara();
  }

  private renderSara() {
    const line = this.peacefulGoal.snapshot().line;

    if (line && this.homecoming.snapshot().stage === 'waiting') this.sara.renderWelcome(copy(line));
    else this.sara.render(this.homecoming.snapshot(), this.returning.snapshot().stage === 'seated');
  }

  // eslint-disable-next-line max-lines-per-function -- Die echte Zielfläche bestimmt die sichere rein visuelle Bewegung auf demselben Regal.
  private beginBallPlay() {
    const goal = this.room.goal;
    const shelf = this.room.definition.platforms.find((p) => p.id === goal.surfaceId);
    const left = shelf?.bounds.x ?? 0;
    const right = shelf ? left + shelf.bounds.width : this.room.definition.width;

    this.ballPlayLayout = ballPlayPlacement(goal.x, left, right);
    this.ballPlayOrigin = this.pixel.x;
    this.ballPlay.start();
    this.syncActivity();
    this.renderBallPlay();
  }

  private advanceBallPlay(elapsed: number) {
    const finished = this.ballPlay.advance(elapsed);

    this.renderBallPlay();

    if (finished) {
      this.pixel.finishBallPlay(this.ballPlayVisualX);
      this.startHomecoming();
    }
  }

  // eslint-disable-next-line max-lines-per-function -- Ball und Figur folgen dem freigegebenen gemeinsamen Zeitprofil; Interaktionen und Wertung bleiben eingefroren.
  private renderBallPlay() {
    const snapshot = this.ballPlay.snapshot();
    const pose = ballPlayPose(snapshot.elapsedMs, motionPreferences.snapshot().reduced);
    const { direction, travel, anchorX } = this.ballPlayLayout;
    const aligned = this.ballPlayOrigin + (anchorX - this.ballPlayOrigin) * pose.alignment;
    const offset = (pose.ball * direction * travel) / 48;
    const aligning =
      snapshot.elapsedMs > 0 &&
      snapshot.elapsedMs < 400 &&
      Math.abs(anchorX - this.ballPlayOrigin) > 2 &&
      pose.alignment > 0;
    const frame = aligning ? 5 + (Math.floor(snapshot.elapsedMs / 100) % 5) : pose.frame;
    const faceLeft = aligning
      ? anchorX < this.ballPlayOrigin
      : direction > 0
        ? pose.faceLeft
        : !pose.faceLeft;

    this.ballPlayVisualX = aligned + direction * pose.step;
    this.pixel.presentBallPlay(
      frame,
      pose.scale,
      this.ballPlayVisualX - this.ballPlayOrigin,
      faceLeft,
    );
    this.goalView.presentBallPlay(offset, offset / 8, snapshot.active);
    this.goalView.render(this.goal.snapshot(), true);
  }

  // eslint-disable-next-line max-lines-per-function -- Aktionssound und Zielanzeige enden gemeinsam vor der unveränderten Heimkehr.
  private startHomecoming() {
    if (this.ballPlay.snapshot().active) return;
    this.audio.updatePixel('idle', this.pixel.y);
    const score = this.round.snapshot().finalChaosScore;

    if (score === null) return;
    this.goal.finish(this.round.snapshot().endReason ?? 'timer');
    this.goalView.render(this.goal.snapshot(), true);
    const welcome = this.peacefulGoal.snapshot().line;

    this.homecoming.start(
      score,
      this.random,
      this.reactionDamage.snapshot(),
      welcome ? copy(welcome) : undefined,
    );
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
    this.audio.updateMovement(this.pixel.activity, this.pixel.snapshot());

    if (walking && this.returning.snapshot().stage === 'seated') this.syncActivity();
  }

  private advanceCharm(input: InputState, elapsed: number) {
    const before = this.charm.snapshot();

    this.charm.advance(elapsed);

    if (input.confirmPressed) this.charm.confirm();
    this.charm.input(input.arrows);
    this.charmPresentation.update(before, this.charm.snapshot(), elapsed);
    this.renderCharmMotion();
    this.charmView.render(this.charm.snapshot());
    this.renderResult(elapsed);
  }

  private renderCharmMotion() {
    const pose = this.ending.pixelPose(
      this.charmPresentation.motion.pose(motionPreferences.snapshot().reduced),
    );

    this.pixel.presentCharm(homecomingCharmPose(pose, this.room.definition.homecomingSide));
  }

  // eslint-disable-next-line max-lines-per-function -- Ergebnis, Album und rein visuelle Abschlusszeit werden in derselben Darstellung synchronisiert.
  private renderResult(elapsed = 0) {
    const result = roundResult(
      this.round.snapshot(),
      this.homecoming.snapshot(),
      this.charm.snapshot(),
      this.difficulty,
    );

    this.ending.update(
      result,
      this.charmPresentation.motion.pose(motionPreferences.snapshot().reduced),
      elapsed,
    );
    this.presentEnding();
    this.resultView.render(result, this.roundAlbum.confirm(result, this.room.definition.id).length);

    if (result) this.albumBanners.show(this.roundAlbum.confirmedBanners(), elapsed);
    this.controls.showRestart(result !== null);
    this.roomSelection.showReturn(result !== null);
  }

  private presentEnding() {
    const pose = this.ending.pose(motionPreferences.snapshot().reduced);

    if (!pose) return;
    this.sara.renderEnding(pose);
    this.renderCharmMotion();
  }

  private faceSara() {
    this.pixel.faceToward(
      homecomingPositions(this.room.definition.width, this.room.definition.homecomingSide).saraEndX,
    );
  }

  // eslint-disable-next-line max-lines-per-function -- Einmalige Phasenübergänge und ihre Ansichten werden atomar aus demselben Snapshot synchronisiert.
  private syncHomecoming() {
    const snapshot = this.homecoming.snapshot();

    if (snapshot.stage !== 'entering' && snapshot.stage !== 'waiting') this.round.startReaction();

    if (snapshot.stage === 'complete' && !snapshot.selection?.peaceful) {
      this.round.startReconciliation();
      this.charm.start(snapshot.selection?.score ?? 0, this.difficulty);
      this.charmView.render(this.charm.snapshot());
    }

    this.sara.render(snapshot, this.returning.snapshot().stage === 'seated');
    this.renderResult();
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
