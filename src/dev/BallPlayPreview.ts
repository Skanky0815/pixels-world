import Phaser from 'phaser';
import { LIVING_ROOM } from '../content/rooms/living-room';
import { OBJECTS } from '../content/objects/catalog';
import { resolveRoom } from '../game/content/resolve-room';
import { createRoomPhysics } from '../game/content/object-playfield';
import { buildObjects } from '../game/content/build-objects';
import { preloadRoomArt } from '../game/assets/room-art';
import { preloadShelfArt } from '../game/assets/shelf-art';
import { preloadVaseArt } from '../game/assets/vase-art';
import { preloadCouchArt } from '../game/assets/couch-art';
import { preloadCurtainArt } from '../game/assets/curtain-art';
import { preloadCatgrassArt } from '../game/assets/catgrass-art';
import { preloadPictureArt } from '../game/assets/picture-art';
import { preloadBookArt } from '../game/assets/book-art';
import { preloadCarpetArt } from '../game/assets/carpet-art';
import { preloadFavoriteBallArt } from '../game/assets/favorite-ball-art';
import { spriteUrl } from '../game/assets/urls';

const DURATION = 3600;
const phases = ['Oh, mein Ball!', 'Stups!', 'Hinterher!', 'Hab dich!', 'Meins.'];

/** Isolated visual proposal: no actor, goal, score or homecoming controller is created. */
export class BallPlayPreview extends Phaser.Scene {
  private pixel!: Phaser.GameObjects.Sprite;
  private ball!: Phaser.GameObjects.Image;
  private elapsed = 0;
  private playing = true;
  private floor = false;
  private zoomed = false;
  private reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // eslint-disable-next-line max-lines-per-function -- Dieselben bestehenden Raum- und Figurenassets werden ohne neue Bildquellen geladen.
  preload() {
    for (const load of [
      preloadRoomArt,
      preloadShelfArt,
      preloadVaseArt,
      preloadCouchArt,
      preloadCurtainArt,
      preloadCatgrassArt,
      preloadPictureArt,
      preloadBookArt,
      preloadCarpetArt,
      preloadFavoriteBallArt,
    ])
      load(this);
    this.load.spritesheet('pixel', spriteUrl('pixel'), { frameWidth: 32, frameHeight: 32 });
  }

  create() {
    createRoomPhysics(this, LIVING_ROOM);
    buildObjects(this, resolveRoom(LIVING_ROOM, OBJECTS));
    this.physics.world.pause();
    this.pixel = this.add.sprite(0, 0, 'pixel').setOrigin(0.5, 1).setDepth(20);
    this.ball = this.add.image(0, 0, 'favorite-ball').setDepth(21);
    this.bindControls();
    this.renderMoment();
  }

  // eslint-disable-next-line max-lines-per-function -- Lokale Vorschau-Steuerung wird gemeinsam gebunden und beim Szenenende abgemeldet.
  private bindControls() {
    const abort = new AbortController();
    const bind = (id: string, event: string, action: () => void) =>
      element(id).addEventListener(event, action, { signal: abort.signal });

    bind('replay', 'click', () => {
      this.elapsed = 0;
      this.playing = true;
    });
    bind('pause', 'click', () => {
      this.playing = !this.playing;
    });
    bind('zoom', 'click', () => {
      this.zoomed = !this.zoomed;
      this.renderMoment();
    });
    bind('placement', 'change', () => {
      this.floor = (element('placement') as HTMLSelectElement).value === 'floor';
      this.elapsed = 0;
      this.renderMoment();
    });
    bind('timeline', 'input', () => {
      this.elapsed = Number((element('timeline') as HTMLInputElement).value);
      this.playing = false;
      this.renderMoment();
    });
    const reduced = element('reduced') as HTMLInputElement;

    reduced.checked = this.reduced;
    bind('reduced', 'change', () => {
      this.reduced = reduced.checked;
      this.renderMoment();
    });
    document.addEventListener(
      'visibilitychange',
      () => {
        if (document.hidden) this.playing = false;
      },
      { signal: abort.signal },
    );
    window.addEventListener(
      'blur',
      () => {
        this.playing = false;
      },
      { signal: abort.signal },
    );
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => abort.abort());
  }

  update(_time: number, delta: number) {
    if (this.playing) this.elapsed = Math.min(DURATION, this.elapsed + Math.min(delta, 50));

    if (this.elapsed === DURATION) this.playing = false;
    this.renderMoment();
  }

  // eslint-disable-next-line max-lines-per-function, complexity -- Fünf visuelle Phasen und zwei Platzvarianten teilen einen scrubbaren Zeitwert; kein Spielzustand wird verändert.
  private renderMoment() {
    const t = this.elapsed;
    const phase = t < 450 ? 0 : t < 950 ? 1 : t < 1900 ? 2 : t < 2500 ? 3 : 4;
    const direction = this.floor ? 1 : -1;
    const origin = this.floor ? 520 : 882;
    const surface = this.floor ? 468 : 154;
    const travel = this.floor ? 64 : 6;
    const roll = Phaser.Math.Clamp((t - 650) / 1250, 0, 1);
    const catchUp = Phaser.Math.Clamp((t - 1000) / 1000, 0, 1);
    const ballOffset = this.reduced ? 0 : travel * Math.sin((roll * Math.PI) / 2);
    const pixelOffset = this.reduced ? 0 : travel * catchUp;
    const paw = !this.reduced && (phase === 1 || phase === 3);
    const frame = this.frame(phase, paw);

    this.pixel
      .setPosition(origin + direction * pixelOffset, surface)
      .setFrame(frame)
      .setScale(paw ? 2.5 : 2)
      .setFlipX(direction < 0);
    this.ball
      .setPosition(origin + direction * (32 + ballOffset), surface - 8)
      .setRotation((direction * ballOffset) / 8);
    this.cameras.main.setZoom(this.zoomed ? 2.5 : 1);
    this.cameras.main.centerOn(this.zoomed ? origin : 480, this.zoomed ? surface - 40 : 270);
    this.renderControls(phase);
  }

  private frame(phase: number, paw: boolean) {
    if (paw) return [20, 21, 22][Math.floor(this.elapsed / 125) % 3];

    if (!this.reduced && phase === 2) return 5 + (Math.floor(this.elapsed / 100) % 5);

    return phase === 4 ? 2 : 0;
  }

  private renderControls(phase: number) {
    (element('timeline') as HTMLInputElement).value = String(this.elapsed);
    element('phase').textContent = `${phases[phase]} · ${(this.elapsed / 1000).toFixed(1)} / 3,6 s`;
    element('pause').textContent = this.playing ? 'Pause' : 'Abspielen';
    element('zoom').setAttribute('aria-pressed', String(this.zoomed));
    element('placement-note').textContent = this.floor
      ? 'Bodenvariante: 64 Pixel Ballweg. Der Abstieg nach dem Fund ist noch nicht Teil dieses Entwurfs.'
      : 'Fundort-Regal: nur 6 Pixel Ballweg. Kein Absturz und kein Kontakt mit der Vase.';
  }
}

function element(id: string) {
  const node = document.getElementById(id);

  if (!node) throw new Error(`Mockup-Steuerung fehlt: ${id}`);

  return node;
}
