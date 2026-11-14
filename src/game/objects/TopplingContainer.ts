import type Phaser from 'phaser';
import { DamageHistory } from '../domain/chaos-event';
import type { ImpactBody, ImpactHit } from '../domain/impact-world';
import { Toppling, type TopplingRules } from '../interactions/toppling';
import {
  overlaps,
  type InteractionContext,
  type InteractionResult,
  type Bounds,
} from '../interactions/contracts';
import { TopplingContainerArt } from './toppling-container-art';

export interface TopplingContainerConfig {
  readonly id: string;
  readonly x: number;
  readonly floorY: number;
  readonly supportY: number;
  readonly rules: TopplingRules;
}

export interface TopplingContainerProfile {
  readonly width: number;
  readonly height: number;
  readonly spilledWidth: number;
  readonly spilledHeight: number;
  readonly mass: number;
  readonly impactPower: number;
  readonly intactTexture: string;
  readonly spilledTexture: string;
}

/** Shared kinematic tipping, bounded contents and incoming/outgoing contacts. */
export class TopplingContainer {
  readonly id: string;
  readonly maximumScore: number;
  private readonly model: Toppling<'upright'>;
  private readonly history = new DamageHistory();
  private readonly art: TopplingContainerArt;
  private readonly graphic: Phaser.GameObjects.Container;
  private direction = 1;
  private nudgeMs = 0;
  private toppledBy: string | null = null;
  private drop: { from: number; elapsed: number; duration: number } | null = null;

  // eslint-disable-next-line max-lines-per-function -- Identität, parametrisiertes Kippmodell und gemeinsame Darstellung werden zusammen initialisiert.
  constructor(
    scene: Phaser.Scene,
    private readonly config: TopplingContainerConfig,
    private readonly profile: TopplingContainerProfile,
  ) {
    this.id = config.id;
    this.maximumScore = config.rules.points;
    this.model = new Toppling(this.id, config.rules, 'spill', 'upright');
    this.art = new TopplingContainerArt(scene, profile);
    this.graphic = this.art.root.setPosition(config.x, config.supportY).setDepth(0.5);
  }

  // eslint-disable-next-line max-lines-per-function -- Reale Körperüberschneidung und intakter Zustand begrenzen den einzigen direkten Pixelkontakt.
  eligible(context: InteractionContext) {
    return (
      this.model.snapshot().state !== 'fallen' &&
      overlaps(context.pixel, {
        x: this.graphic.x - this.profile.width / 2,
        y: this.graphic.y - this.profile.height,
        width: this.profile.width,
        height: this.profile.height,
      })
    );
  }

  // eslint-disable-next-line max-lines-per-function -- Reale Pixelkontakte, leichte Fremdstöße, regulärer Fall und einmaliger Schaden teilen dieselbe aktive Framezeit.
  update(context: InteractionContext, active: boolean): InteractionResult {
    const delta = Number.isFinite(context.delta) ? Math.max(0, context.delta) : 0;
    const touching = active && this.eligible(context);

    this.touchPixel(context, touching);
    const wasFalling = this.model.snapshot().state === 'falling';
    const event = this.model.update(delta, touching || this.nudgeMs > 0);

    this.nudgeMs = Math.max(0, this.nudgeMs - delta);

    if (!wasFalling && this.model.snapshot().state === 'falling') this.toppledBy ??= 'pixel';

    if (event) this.history.record(event);
    this.advanceDrop(delta);
    this.draw();

    return { action: 'idle', event };
  }

  private touchPixel(context: InteractionContext, touching: boolean) {
    if (!touching) return;
    const direction = context.pixel.x < this.graphic.x ? 1 : -1;

    const approaching = (this.graphic.x - context.pixel.x) * context.pixel.velocityX > 0;

    if ((approaching && Math.abs(context.pixel.velocityX) >= 150) || context.pixel.velocityY >= 150)
      this.topple(direction, 'pixel');

    if (this.model.snapshot().state !== 'falling') this.direction = direction;
  }

  private topple(direction: number, source: string) {
    if (!this.model.knockOver()) return false;
    this.direction = direction;
    this.toppledBy = source;

    return true;
  }

  private draw() {
    const state = this.model.snapshot();
    const progress =
      state.state === 'fallen' ? 1 : state.state === 'falling' ? Math.min(1, state.progress) : 0;

    this.graphic.x = this.config.x + this.direction * 12 * progress;
    this.art.render(state, this.direction);
  }

  // eslint-disable-next-line max-lines-per-function -- Verlorene Auflagen geben auch einen schon ausgelaufenen Behälter frei, ohne dessen Schaden erneut zu werten.
  releaseSupport(surface: Bounds) {
    if (
      this.drop ||
      Math.abs(this.graphic.y - surface.y) > 2 ||
      this.graphic.x + this.profile.width / 2 <= surface.x ||
      this.graphic.x - this.profile.width / 2 >= surface.x + surface.width
    )
      return;
    const state = this.model.snapshot();
    const remaining = state.state === 'falling' ? 1 - state.progress : 1;

    this.drop = {
      from: this.graphic.y,
      elapsed: 0,
      duration: Math.max(1, this.config.rules.fallMs * remaining),
    };
    this.topple(this.direction, 'support');
  }

  private advanceDrop(delta: number) {
    if (!this.drop) return;
    this.drop.elapsed += Math.max(0, delta);
    const progress = Math.min(1, this.drop.elapsed / this.drop.duration);

    this.graphic.y = this.drop.from + (this.config.floorY - this.drop.from) * progress ** 2;

    if (progress >= 1) this.drop = null;
  }

  // eslint-disable-next-line max-lines-per-function -- Aktuelle Silhouette, parametrisiertes Gewicht und gerichtete Kippbewegung bilden denselben Kontaktvertrag wie alle anderen Objekte.
  impactBody(): ImpactBody {
    const state = this.model.snapshot();
    const progress =
      state.state === 'fallen' ? 1 : state.state === 'falling' ? Math.min(1, state.progress) : 0;
    const width = this.profile.width + (this.profile.spilledWidth - this.profile.width) * progress,
      height = this.profile.height + (this.profile.spilledHeight - this.profile.height) * progress;

    return {
      id: this.id,
      bounds: { x: this.graphic.x - width / 2, y: this.graphic.y - height, width, height },
      mass: this.profile.mass,
      enabled: true,
      moving: state.state === 'falling' || this.drop !== null,
      surface: state.state === 'fallen' ? 'soft' : 'loose',
      velocityX: state.state === 'falling' ? this.direction * 100 : 0,
      velocityY: this.drop ? 240 : 0,
    };
  }

  receiveImpact(hit: ImpactHit) {
    if (hit.power >= this.profile.impactPower) this.topple(hit.direction, hit.sourceId);
    else if (hit.power >= 30 && this.model.snapshot().state !== 'fallen') this.nudgeMs = 250;

    return [];
  }

  damageSnapshot() {
    return this.history.snapshot();
  }

  // eslint-disable-next-line max-lines-per-function -- Zustand, Bild, Lage und kausale Herkunft bleiben als losgelöster Beobachtungsvertrag zusammen.
  snapshot() {
    const state = this.model.snapshot();

    return {
      id: this.id,
      ...state,
      state: state.state === 'fallen' ? 'spilled' : state.state,
      ...this.history.snapshot(),
      art: this.art.snapshot(),
      x: this.graphic.x,
      y: this.graphic.y,
      supportY: this.config.supportY,
      floorY: this.config.floorY,
      direction: this.direction,
      dropping: this.drop !== null,
      toppledBy: this.toppledBy,
    };
  }

  reset() {
    this.model.reset();
    this.history.reset();
    this.drop = null;
    this.direction = 1;
    this.nudgeMs = 0;
    this.toppledBy = null;
    this.graphic.setPosition(this.config.x, this.config.supportY);
    this.draw();
  }

  destroy() {
    this.graphic.destroy(true);
  }
}
