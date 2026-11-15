import type Phaser from 'phaser';
import type {
  Bounds,
  Interactable,
  InteractionContext,
  InteractionResult,
} from '../interactions/contracts';
import type { ImpactHit } from '../domain/impact-world';
import { FridgeRummaging } from '../interactions/fridge-rummaging';
import { DamageHistory } from '../domain/chaos-event';
import { motionPreferences } from '../../settings/motion';
import { onLanguageChange, t } from '../../i18n/locale';

/** Stable furniture and its bounded interior action share one visual lifetime. */
export class FridgeArt implements Interactable {
  readonly root: Phaser.GameObjects.Container;
  readonly boardHeight: number;
  readonly debrisBoardHeight: number;
  readonly debrisBottom = 0;
  readonly id: string;
  private readonly model: FridgeRummaging;
  private readonly history = new DamageHistory();
  private readonly graphic: Phaser.GameObjects.Image;
  private readonly interior: Phaser.GameObjects.Graphics;
  private readonly hint: Phaser.GameObjects.Text;
  private nudgeUntil = 0;

  // eslint-disable-next-line max-lines-per-function -- Körpermaße, Bild, Hinweis und Sprachbindung besitzen denselben Möbel-Lebenszyklus.
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly b: Bounds,
    private readonly floorY: number,
    id: string,
  ) {
    this.id = id;
    this.model = new FridgeRummaging(id);
    this.boardHeight = floorY - b.y;
    this.debrisBoardHeight = b.width;
    this.interior = scene.add.graphics();
    this.interior
      .fillStyle(0x6b4633)
      .fillRect(-b.width / 2 + 6, -this.boardHeight + 6, b.width - 12, this.boardHeight - 12);
    this.interior
      .fillStyle(0xe6d4ad)
      .fillRect(-b.width / 2 + 12, -this.boardHeight + 12, b.width - 24, this.boardHeight - 26);

    for (const y of [70, 144, 218]) {
      this.interior
        .fillStyle(0x9f7752)
        .fillRect(-b.width / 2 + 12, -this.boardHeight + y, b.width - 24, 6);
      this.interior
        .fillStyle(0x91764c)
        .fillRect(-b.width / 2 + 30, -this.boardHeight + y - 28, 22, 28);
      this.interior.fillStyle(0xa85543).fillRect(4, -this.boardHeight + y - 22, 26, 22);
    }

    this.graphic = scene.add.image(0, 0, 'fridge-upright').setOrigin(0.5, 1);
    this.hint = scene.add
      .text(0, -this.boardHeight - 68, '', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#653624',
        backgroundColor: '#f3dfbd',
      })
      .setOrigin(0.5, 1)
      .setVisible(false);
    this.root = scene.add
      .container(b.x + b.width / 2, floorY, [this.interior, this.graphic, this.hint])
      .setDepth(0.5);
    this.root.once(
      'destroy',
      onLanguageChange(() => this.draw(0)),
    );
    this.draw(0);
  }

  eligible(context: InteractionContext) {
    return this.model.snapshot().captured || (!context.pixel.grounded && this.sideContact(context));
  }

  private sideContact(context: InteractionContext) {
    const p = context.pixel;

    if (p.climbing || p.bottom <= this.b.y + 2 || p.top >= this.floorY) return false;
    const right = p.left + p.bodyWidth;
    const leftSide = Math.abs(right - this.b.x) <= 2 && context.input.horizontal >= 0;
    const rightSide =
      Math.abs(p.left - this.b.x - this.b.width) <= 2 && context.input.horizontal <= 0;

    return leftSide || rightSide;
  }

  // eslint-disable-next-line max-lines-per-function -- Sprungbeobachtung, begrenzte Besuchszeit, Ereignis und Bild gehören zu einem gemeinsamen Frame.
  update(context: InteractionContext, active: boolean): InteractionResult {
    const p = context.pixel;
    const bump = this.model.observeJump(
      context.input.jumpPressed && p.grounded,
      p.grounded,
      this.sideContact(context),
      p.climbing,
      Math.abs(p.left + p.bodyWidth - this.b.x) <= 2 &&
        p.top < this.b.y + 184 &&
        p.bottom > this.b.y + 94,
    );
    const event = this.model.update(context.delta);

    if (bump) this.scene.events.emit('object-impact', 'creak');

    if (event) this.history.record(event);
    this.draw(context.time);

    return { action: 'idle', event, faceX: active ? this.b.x + this.b.width / 2 : undefined };
  }

  // eslint-disable-next-line max-lines-per-function -- Schwache Rückmeldung und einmaliger Fremdschaden verwenden denselben Kontaktvertrag.
  receiveImpact(hit: ImpactHit) {
    if (hit.counter) return [];

    if (hit.power >= 500) {
      const event = this.model.disturb();

      if (event) this.history.record(event);
      this.draw(hit.time);

      return event ? [event] : [];
    }

    if (hit.power >= 30) this.nudgeUntil = hit.time + 250;

    return [];
  }

  // Shelf stability remains stable; its ordinary platform and loose top objects do not disappear.
  render() {}

  // eslint-disable-next-line max-lines-per-function, complexity -- Türzustand, Bildanker, reduzierte Bewegung und lokalisierter Hinweis werden gemeinsam dargestellt.
  private draw(time: number) {
    const state = this.model.snapshot();
    const open = state.state === 'open';
    const pulling = state.state === 'opening' || state.hidden;
    const wobble = state.hidden || state.state === 'warning' || time < this.nudgeUntil;

    this.graphic
      .setTexture(open ? 'fridge-open' : 'fridge-upright')
      .setDisplaySize(open ? this.b.width * 1.3 : this.b.width, this.boardHeight)
      .setX(open ? this.b.width * 0.15 : 0);
    this.interior.setVisible(pulling);

    if (pulling) {
      const width = this.b.width * (1 - state.doorProgress * 0.8);

      this.graphic.setDisplaySize(width, this.boardHeight).setX((this.b.width - width) / 2);
    }

    this.root.setAngle(
      wobble && !motionPreferences.snapshot().reduced ? Math.sin(time / 48) * 2.5 : 0,
    );
    this.hint
      .setText(
        t(state.captured ? (state.hidden ? 'fridgeRummaging' : 'fridgeHandle') : 'fridgeWarning'),
      )
      .setVisible(state.state === 'warning' || state.captured);
  }

  damageSnapshot() {
    return this.history.snapshot();
  }

  abortVisit() {
    if (this.model.snapshot().state === 'warning' || this.model.snapshot().captured) {
      this.model.reset();
      this.draw(0);
    }
  }

  snapshot() {
    return {
      ...this.model.snapshot(),
      ...this.history.snapshot(),
      angle: this.root.angle,
      texture: this.graphic.texture.key,
    };
  }

  reset() {
    this.model.reset();
    this.history.reset();
    this.nudgeUntil = 0;
    this.draw(0);
  }

  destroy() {
    this.root.destroy(true);
  }
}
