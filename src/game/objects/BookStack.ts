import type Phaser from 'phaser';
import { DamageHistory } from '../domain/chaos-event';
import { BookToppling, type BookRules } from '../interactions/book-toppling';
import {
  overlaps,
  type InteractionContext,
  type InteractionResult,
} from '../interactions/contracts';
import { drawBooks } from './book-art';
import { playBookImpact } from '../assets/book-impact';

export interface BookStackConfig {
  readonly id: string;
  readonly x: number;
  readonly floorY: number;
  readonly rules: BookRules;
}

export class BookStack {
  readonly id: string;
  readonly maximumScore: number;
  private readonly model: BookToppling;
  private readonly history = new DamageHistory();
  private readonly graphic: Phaser.GameObjects.Graphics;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly config: BookStackConfig,
  ) {
    this.id = config.id;
    this.maximumScore = config.rules.points;
    this.model = new BookToppling(this.id, config.rules);
    this.graphic = scene.add.graphics().setPosition(config.x, config.floorY).setDepth(0.5);
    this.draw();
  }

  eligible(context: InteractionContext) {
    const area = { x: this.config.x - 24, y: this.config.floorY - 36, width: 48, height: 36 };

    return this.model.snapshot().state !== 'fallen' && overlaps(context.pixel, area);
  }

  update(context: InteractionContext, active: boolean): InteractionResult {
    const event = this.model.update(context.delta, active && this.eligible(context));

    if (event) {
      this.history.record(event);
      playBookImpact(this.scene);
    }

    this.draw();

    return { action: 'idle', event };
  }

  private draw() {
    drawBooks(this.graphic, this.model.snapshot());
  }

  damageSnapshot() {
    return this.history.snapshot();
  }

  snapshot() {
    return {
      ...this.model.snapshot(),
      ...this.damageSnapshot(),
      x: this.config.x,
      floorY: this.config.floorY,
    };
  }

  reset() {
    this.model.reset();
    this.history.reset();
    this.draw();
  }

  destroy() {
    this.graphic.destroy();
  }
}
