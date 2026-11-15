import type Phaser from 'phaser';
import type {
  Bounds,
  Interactable,
  InteractionContext,
  InteractionResult,
} from '../interactions/contracts';
import { standingStill } from '../interactions/contracts';
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
    this.graphic = scene.add.image(0, 0, 'fridge-upright').setOrigin(0.5, 1);
    this.hint = scene.add
      .text(0, -this.boardHeight - 8, '', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#653624',
        backgroundColor: '#f3dfbd',
      })
      .setOrigin(0.5, 1)
      .setVisible(false);
    this.root = scene.add
      .container(b.x + b.width / 2, floorY, [this.graphic, this.hint])
      .setDepth(0.5);
    this.root.once(
      'destroy',
      onLanguageChange(() =>
        this.hint.setText(t(this.model.snapshot().hidden ? 'fridgeRummaging' : 'fridgeWarning')),
      ),
    );
    this.draw(0);
  }

  // eslint-disable-next-line max-lines-per-function -- Bodenanker, Seitenreichweite und bestehende Eingaberuhe bilden eine gemeinsame Kontaktprüfung.
  eligible(context: InteractionContext) {
    if (this.model.snapshot().hidden) return true;
    const p = context.pixel;
    const nearby = p.left + p.bodyWidth >= this.b.x - 12 && p.left <= this.b.x + this.b.width + 12;

    return (
      this.model.snapshot().state !== 'open' &&
      standingStill(context) &&
      Math.abs(p.bottom - this.floorY) < 2 &&
      nearby
    );
  }

  update(context: InteractionContext, active: boolean): InteractionResult {
    const before = this.model.snapshot().state;
    const event = this.model.update(context.delta, active && this.eligible(context));
    const after = this.model.snapshot().state;

    if (before !== after && after === 'inside') this.scene.events.emit('object-impact', 'creak');

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
    const wobble = state.hidden || time < this.nudgeUntil;

    this.graphic
      .setTexture(open ? 'fridge-open' : 'fridge-upright')
      .setDisplaySize(open ? this.b.width * 1.3 : this.b.width, this.boardHeight)
      .setX(open ? this.b.width * 0.15 : 0);
    this.root.setAngle(
      wobble && !motionPreferences.snapshot().reduced ? Math.sin(time / 48) * 2.5 : 0,
    );
    this.hint
      .setText(t(this.model.snapshot().hidden ? 'fridgeRummaging' : 'fridgeWarning'))
      .setVisible(state.state === 'warning' || state.hidden);
  }

  damageSnapshot() {
    return this.history.snapshot();
  }

  abortVisit() {
    if (['warning', 'inside'].includes(this.model.snapshot().state)) {
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
