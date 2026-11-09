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

const DURATION = 4200;
const phases = [
  'Oh, mein Ball!',
  'Nach rechts!',
  'Hinterherdrehen',
  'Und zurück!',
  'Zur anderen Seite',
  'Hab dich!',
  'Meins.',
];

/** Isolated visual proposal: no actor, goal, score or homecoming controller is created. */
export class BallPlayPreview extends Phaser.Scene {
  private pixel!: Phaser.GameObjects.Sprite;
  private ball!: Phaser.GameObjects.Image;
  private elapsed = 0;
  private playing = true;
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
    this.cameras.main.setBounds(0, 0, 960, 540);
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

  // eslint-disable-next-line max-lines-per-function, complexity -- Zwei Ballwege und die zugehörigen Richtungswechsel teilen einen scrubbaren Zeitwert; kein Spielzustand wird verändert.
  private renderMoment() {
    const t = this.elapsed;
    const phase =
      t < 400 ? 0 : t < 700 ? 1 : t < 1500 ? 2 : t < 1800 ? 3 : t < 2600 ? 4 : t < 3000 ? 5 : 6;
    const outward = Phaser.Math.Clamp((t - 700) / 800, 0, 1);
    const inward = Phaser.Math.Clamp((t - 1800) / 800, 0, 1);
    const ballOffset = this.reduced ? 0 : 48 * (outward - inward);
    const following = phase === 2 || phase === 4;
    const turning = Math.abs(t - 1100) < 90 || Math.abs(t - 2200) < 90;
    const paw = !this.reduced && [1, 3, 5].includes(phase);
    const faceLeft = this.reduced || t < 1100 || t >= 2200;
    const step = this.reduced ? 0 : 4 * Math.sin(Math.PI * (outward - inward));
    const frame = this.frame(phase, paw, following && !turning);

    this.pixel
      .setPosition(874 + step, 154)
      .setFrame(frame)
      .setScale(paw ? 2.5 : 2)
      .setFlipX(faceLeft);
    this.ball.setPosition(850 + ballOffset, 146).setRotation(ballOffset / 8);
    this.cameras.main.setZoom(this.zoomed ? 2.5 : 1);
    this.cameras.main.centerOn(this.zoomed ? 874 : 480, this.zoomed ? 114 : 270);
    this.renderControls(phase);
  }

  private frame(phase: number, paw: boolean, following: boolean) {
    if (paw) return [20, 21, 22][Math.floor(this.elapsed / 125) % 3];

    if (!this.reduced && following) return 5 + (Math.floor(this.elapsed / 100) % 5);

    return phase === 6 ? 2 : 0;
  }

  private renderControls(phase: number) {
    (element('timeline') as HTMLInputElement).value = String(this.elapsed);
    element('phase').textContent = `${phases[phase]} · ${(this.elapsed / 1000).toFixed(1)} / 4,2 s`;
    element('pause').textContent = this.playing ? 'Pause' : 'Abspielen';
    element('zoom').setAttribute('aria-pressed', String(this.zoomed));
    element('placement-note').textContent =
      'Auf dem Fundort-Regal: 48 Pixel nach rechts und zurück. Pixel folgt mit kleinen Schritten und zwei Richtungswechseln.';
  }
}

function element(id: string) {
  const node = document.getElementById(id);

  if (!node) throw new Error(`Mockup-Steuerung fehlt: ${id}`);

  return node;
}
