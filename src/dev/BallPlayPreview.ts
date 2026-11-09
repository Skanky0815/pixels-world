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

import {
  BALL_PLAY_DURATION as DURATION,
  ballPlayPose,
  type BallPlayPhase,
} from '../game/domain/ball-play';

const phases: Record<BallPlayPhase, string> = {
  look: 'Oh, mein Ball!',
  'tap-right': 'Nach rechts!',
  'follow-right': 'Hinterherdrehen',
  'tap-left': 'Und zurück!',
  'follow-left': 'Zur anderen Seite',
  catch: 'Hab dich!',
  settle: 'Meins.',
};

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

  // eslint-disable-next-line max-lines-per-function -- Die Vorschau zeigt exakt das mit der Spielintegration gemeinsame Zeitprofil.
  private renderMoment() {
    const pose = ballPlayPose(this.elapsed, this.reduced);

    this.pixel
      .setPosition(874 + pose.step, 154)
      .setFrame(pose.frame)
      .setScale(pose.scale)
      .setFlipX(pose.faceLeft);
    this.ball.setPosition(850 + pose.ball, 146).setRotation(pose.ball / 8);
    this.cameras.main.setZoom(this.zoomed ? 2.5 : 1);
    this.cameras.main.centerOn(this.zoomed ? 874 : 480, this.zoomed ? 114 : 270);
    this.renderControls(pose.phase);
  }

  private renderControls(phase: BallPlayPhase) {
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
