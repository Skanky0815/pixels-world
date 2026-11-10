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
import { spriteUrl } from '../game/assets/urls';
import { SARA_SPRITE } from '../game/actors/sara-animations';
import { homecomingPositions } from '../game/content/homecoming-layout';
import {
  CHARM_PREVIEW_ACTIONS,
  CharmPreviewMotion,
  type CharmPreviewAction,
} from './charm-preview-motion';

/** Isolated pose/layout proposal; no live reconciliation, input timer or game actor is created. */
export class CharmPreview extends Phaser.Scene {
  private readonly motion = new CharmPreviewMotion();
  private pixel!: Phaser.GameObjects.Sprite;
  private sara!: Phaser.GameObjects.Sprite;
  private panel!: Phaser.GameObjects.Container;
  private purr!: Phaser.GameObjects.Text;
  private playing = true;
  private zoomed = true;
  private reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  private readonly positions = homecomingPositions(960);

  // eslint-disable-next-line max-lines-per-function -- Raum und Figuren laden ausschließlich ihre bestehenden unveränderten Quellen.
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
    ])
      load(this);
    this.load.spritesheet('pixel', spriteUrl('pixel'), { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('sara', spriteUrl('sara'), { frameWidth: 64, frameHeight: 96 });
  }

  // eslint-disable-next-line max-lines-per-function -- Beide Figuren teilen echte Raum- und Fußanker; die Welt bleibt vollständig angehalten.
  create() {
    createRoomPhysics(this, LIVING_ROOM);
    buildObjects(this, resolveRoom(LIVING_ROOM, OBJECTS));
    this.physics.world.pause();
    this.cameras.main.setBounds(0, 0, 960, 540);
    this.sara = this.add
      .sprite(this.positions.saraEndX, 468, 'sara')
      .setOrigin(SARA_SPRITE.origin.x, SARA_SPRITE.origin.y)
      .setScale(SARA_SPRITE.scale)
      .setDepth(10);
    this.pixel = this.add
      .sprite(this.positions.pixelSeatX, 436, 'pixel')
      .setOrigin(0.5)
      .setDepth(11);
    this.purr = this.add
      .text(this.positions.pixelSeatX - 12, 386, 'Prrrr …', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#fff1cf',
      })
      .setDepth(12);
    this.createPanel();
    this.bindControls();
    this.trigger('rub');
    document.documentElement.dataset.ready = 'true';
  }

  // eslint-disable-next-line max-lines-per-function -- Der deklarative Layoutvorschlag hält Dialog, Hinweis und Pfeil auf derselben linken Fläche.
  private createPanel() {
    const panel = this.add
      .rectangle(345, 228, 610, 200, 0x403a35, 0.97)
      .setStrokeStyle(2, 0xd4b488);
    const caption = this.add.text(60, 146, 'PIXELS CHARME-OFFENSIVE', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#fff1cf',
    });
    const note = this.add.text(
      60,
      186,
      'Vorschlag: Lesetext und Pfeil links.\nRechts bleibt Platz für beide Figuren.',
      { fontFamily: 'monospace', fontSize: '15px', color: '#e4c182', lineSpacing: 8 },
    );
    const arrow = this.add
      .text(580, 266, '↑', { fontFamily: 'monospace', fontSize: '50px', color: '#e4c182' })
      .setOrigin(0.5);

    this.panel = this.add
      .container(0, 0, [panel, caption, note, arrow])
      .setDepth(30)
      .setVisible(false);
  }

  // eslint-disable-next-line max-lines-per-function -- Bedienung, Fokus-/Visibility-Pause und Aufräumen teilen die Szenenlebensdauer.
  private bindControls() {
    const abort = new AbortController();
    const bind = (id: string, event: string, action: () => void) =>
      element(id).addEventListener(event, action, { signal: abort.signal });
    const select = element<HTMLSelectElement>('charm-action');

    for (const [key, action] of Object.entries(CHARM_PREVIEW_ACTIONS))
      select.add(new Option(action.label, key));
    bind('charm-action', 'change', () => this.trigger(select.value as CharmPreviewAction));
    bind('trigger', 'click', () => this.trigger(select.value as CharmPreviewAction));
    bind('continue', 'click', () => {
      this.motion.release(this.reduced);
      this.playing = true;
      this.renderMoment();
    });
    bind('reset', 'click', () => {
      this.motion.reset();
      this.playing = true;
      this.renderMoment();
    });
    bind('pause', 'click', () => {
      this.playing = !this.playing;
      this.renderMoment();
    });
    bind('zoom', 'click', () => {
      this.zoomed = !this.zoomed;
      this.renderMoment();
    });
    const reduced = element<HTMLInputElement>('reduced');

    reduced.checked = this.reduced;
    bind('reduced', 'change', () => {
      this.reduced = reduced.checked;
      this.renderMoment();
    });
    bind('dialogue', 'change', () => {
      this.panel.setVisible(element<HTMLInputElement>('dialogue').checked);

      if (this.panel.visible) this.zoomed = false;
      this.renderMoment();
    });
    const pause = () => {
      this.playing = false;
      this.renderMoment();
    };

    window.addEventListener('blur', pause, { signal: abort.signal });
    document.addEventListener(
      'visibilitychange',
      () => {
        if (document.hidden) pause();
      },
      { signal: abort.signal },
    );
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => abort.abort());
  }

  private trigger(action: CharmPreviewAction) {
    this.motion.trigger(action, this.reduced);
    this.playing = true;
    element('action-note').textContent =
      `${CHARM_PREVIEW_ACTIONS[action].label} · ${CHARM_PREVIEW_ACTIONS[action].moment}`;
    this.renderMoment();
  }

  update(_time: number, delta: number) {
    if (!this.pixel) return;

    if (this.playing) this.motion.advance(Math.min(delta, 50));
    this.renderMoment();
  }

  // eslint-disable-next-line max-lines-per-function -- Periodische Pose, Fußanker und rein lesbare DEV-Diagnose werden gemeinsam gezeichnet.
  private renderMoment() {
    const pose = this.motion.pose(this.reduced);
    const snapshot = this.motion.snapshot();
    const radians = (pose.angle * Math.PI) / 180;
    const elevation = 16 * pose.scale * (Math.abs(Math.sin(radians)) + Math.abs(Math.cos(radians)));

    this.pixel
      .setFrame(pose.frame)
      .setScale(pose.scale, pose.scale * pose.stretch)
      .setPosition(this.positions.pixelSeatX + pose.x, 468 - elevation - pose.y)
      .setAngle(pose.angle)
      .setFlipX(pose.faceLeft)
      .setDepth(pose.behindSara ? 9 : 11);
    this.sara.setFrame(snapshot.action ? 7 : 0);
    this.purr.setVisible(snapshot.action === 'purr');
    this.cameras.main.setZoom(this.zoomed ? 2.2 : 1);
    this.cameras.main.centerOn(this.zoomed ? 742 : 480, this.zoomed ? 378 : 270);
    const stage = element('charm-stage');

    stage.dataset.action = snapshot.action ?? 'idle';
    stage.dataset.phase = snapshot.phase;
    stage.dataset.elapsed = String(Math.round(snapshot.elapsed));
    stage.dataset.pose = JSON.stringify(pose);
    this.renderControls();
  }

  // eslint-disable-next-line max-lines-per-function -- Status, Pause und Kamerawahl spiegeln denselben nur lesbaren Vorschauzustand.
  private renderControls() {
    const snapshot = this.motion.snapshot();
    const phases = {
      idle: 'Am Sitzplatz',
      approach: 'Einmalige Annäherung',
      loop: 'Schleife · wartet auf die nächste Spieleraktion',
      release: 'Zurück zum Sitzplatz',
    };

    element('motion-status').textContent =
      `${phases[snapshot.phase]} · ${(snapshot.elapsed / 1000).toFixed(1)} s${this.reduced ? ' · statische Bewegungsalternative' : ''}`;
    element('pause').textContent = this.playing ? 'Pause' : 'Abspielen';
    element('pause').setAttribute('aria-pressed', String(!this.playing));
    element('zoom').textContent = this.zoomed ? 'Ganzes Zimmer' : 'Nah ansehen';
    element('zoom').setAttribute('aria-pressed', String(this.zoomed));
  }
}

function element<T extends HTMLElement = HTMLElement>(id: string) {
  const node = document.getElementById(id);

  if (!node) throw new Error(`Charme-Vorschau fehlt: ${id}`);

  return node as T;
}
