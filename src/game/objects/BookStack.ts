import type Phaser from 'phaser';
import { DamageHistory } from '../domain/chaos-event';
import { BookToppling, type BookRules } from '../interactions/book-toppling';
import {
  overlaps,
  type InteractionContext,
  type InteractionResult,
  type Bounds,
} from '../interactions/contracts';
import { BookArt, type BookAppearance } from './book-art';

export interface BookStackConfig {
  readonly id: string;
  readonly x: number;
  readonly floorY: number;
  readonly supportY: number;
  readonly appearance?: BookAppearance;
  readonly rules: BookRules;
}

export class BookStack {
  readonly id: string;
  readonly maximumScore: number;
  private readonly model: BookToppling;
  private readonly history = new DamageHistory();
  private readonly graphic: Phaser.GameObjects.Container;
  private readonly art: BookArt;
  private drop: { from: number; elapsed: number; duration: number } | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly config: BookStackConfig,
  ) {
    this.id = config.id;
    this.maximumScore = config.rules.points;
    this.model = new BookToppling(this.id, config.rules);
    this.art = new BookArt(scene, config.appearance);
    this.graphic = this.art.root.setPosition(config.x, config.supportY).setDepth(0.5);
  }

  eligible(context: InteractionContext) {
    const area = { x: this.config.x - 24, y: this.graphic.y - 36, width: 48, height: 36 };

    return this.model.snapshot().state !== 'fallen' && overlaps(context.pixel, area);
  }

  update(context: InteractionContext, active: boolean): InteractionResult {
    const event = this.model.update(context.delta, active && this.eligible(context));
    const landed = this.advanceDrop(context.delta);

    if (event) this.history.record(event);

    if (landed && !event) this.scene.events.emit('object-impact', 'books');

    this.draw();

    return { action: 'idle', event };
  }

  private draw() {
    this.art.render(this.model.snapshot());
  }

  // eslint-disable-next-line max-lines-per-function -- Nur ein tatsächlich aufliegender Stapel verliert seine Auflage; ein bereits zerstreuter Stapel zählt dadurch keinen zweiten Schaden.
  releaseSupport(surface: Bounds) {
    if (
      this.drop ||
      Math.abs(this.graphic.y - surface.y) > 2 ||
      this.config.x + 24 <= surface.x ||
      this.config.x - 24 >= surface.x + surface.width
    )
      return;
    const state = this.model.snapshot();
    const remaining = state.state === 'falling' ? 1 - state.progress : 1;

    this.drop = {
      from: this.graphic.y,
      elapsed: 0,
      duration: Math.max(1, this.config.rules.fallMs * remaining),
    };
    this.model.releaseSupport();
  }

  private advanceDrop(delta: number) {
    if (!this.drop) return false;
    this.drop.elapsed += Number.isFinite(delta) ? Math.max(0, delta) : 0;
    const progress = Math.min(1, this.drop.elapsed / this.drop.duration);

    this.graphic.y = this.drop.from + (this.config.floorY - this.drop.from) * progress ** 2;

    if (progress < 1) return false;
    this.drop = null;

    return true;
  }

  damageSnapshot() {
    return this.history.snapshot();
  }

  // eslint-disable-next-line max-lines-per-function -- Der lesende Vertrag enthält Ausgangsauflage, aktuelle Höhe und einmalige Schadenshistorie zusammen.
  snapshot() {
    return {
      id: this.id,
      art: this.art.snapshot(),
      appearance: this.config.appearance ?? 'stacked',
      ...this.model.snapshot(),
      ...this.damageSnapshot(),
      x: this.config.x,
      floorY: this.config.floorY,
      supportY: this.config.supportY,
      y: this.graphic.y,
      dropping: this.drop !== null,
    };
  }

  reset() {
    this.model.reset();
    this.history.reset();
    this.drop = null;
    this.graphic.y = this.config.supportY;
    this.draw();
  }

  destroy() {
    this.graphic.destroy(true);
  }
}
