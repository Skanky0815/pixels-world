import type Phaser from 'phaser';
import { DamageHistory } from '../domain/chaos-event';
import type { ImpactBody, ImpactHit } from '../domain/impact-world';
import { TableclothPull, type TableclothRules } from '../interactions/tablecloth-pulling';
import { overlaps, type Bounds, type InteractionContext } from '../interactions/contracts';
import { TableclothArt } from './tablecloth-art';
export interface TableclothConfig {
  readonly id: string;
  readonly surface: Bounds;
  readonly floorY: number;
  readonly hang: number;
  readonly rules: TableclothRules;
}
export class Tablecloth {
  readonly id: string;
  readonly maximumScore: number;
  private readonly model: TableclothPull;
  private readonly history = new DamageHistory();
  private readonly art: TableclothArt;
  private forcedMs = 0;
  private activeTime = 0;
  private nudgeUntil = 0;
  private moving = false;
  private pulledBy: string | null = null;
  constructor(
    scene: Phaser.Scene,
    private readonly config: TableclothConfig,
  ) {
    this.id = config.id;
    this.maximumScore = config.rules.points;
    this.model = new TableclothPull(config.id, config.rules);
    this.art = new TableclothArt(scene, config);
    this.draw();
  }

  // eslint-disable-next-line max-lines-per-function -- Ausschließlich das sichtbare untere Deckenende bildet den direkten Kontaktbereich.
  eligible(context: InteractionContext) {
    const s = this.config.surface;

    return (
      this.model.snapshot().state !== 'displaced' &&
      overlaps(context.pixel, {
        x: s.x + s.width - 12,
        y: s.y + this.config.hang - 28,
        width: 24,
        height: 28,
      })
    );
  }

  // eslint-disable-next-line max-lines-per-function, complexity -- Aktive Zeit, tatsächlicher Stoffweg, einmaliger Schaden und der gemeinsame Oberflächenzug bilden einen atomaren Frame.
  update(context: InteractionContext, active: boolean) {
    const delta = Number.isFinite(context.delta) ? Math.max(0, context.delta) : 0;

    this.activeTime += delta;
    const before = this.model.snapshot();
    const touching = active && this.eligible(context);
    const event = this.model.update(delta, touching || this.forcedMs > 0);

    this.forcedMs = Math.max(0, this.forcedMs - delta);
    const after = this.model.snapshot();
    const dx = after.offset - before.offset;

    this.moving = dx > 0 && after.state !== 'displaced';

    if (touching && dx > 0) this.pulledBy ??= 'pixel';

    if (event) this.history.record(event);
    this.draw();

    return {
      event,
      drag:
        dx > 0
          ? {
              dx,
              surface: this.config.surface,
              area: {
                x: this.config.surface.x + before.offset,
                y: this.config.surface.y - 2,
                width: Math.max(0, this.config.surface.width - before.offset),
                height: 4,
              },
            }
          : null,
    };
  }

  private draw() {
    this.art.render(this.model.snapshot(), this.activeTime, this.activeTime < this.nudgeUntil);
  }

  // eslint-disable-next-line max-lines-per-function -- Der flache reale Tischkantenkontakt bleibt ohne unsichtbaren Körper unter dem Tisch vollständig sichtbar.
  impactBody(): ImpactBody {
    const s = this.config.surface,
      state = this.model.snapshot();

    return {
      id: this.id,
      bounds: {
        x: s.x + Math.min(state.offset, s.width),
        y: s.y - 2,
        width: Math.max(1, s.width - state.offset),
        height: 4,
      },
      mass: 2,
      enabled: state.state !== 'displaced',
      moving: this.moving,
      surface: 'soft',
      velocityX: this.moving ? (this.config.rules.travel * 1000) / this.config.rules.pullMs : 0,
    };
  }

  receiveImpact(hit: ImpactHit) {
    if (hit.counter || this.model.snapshot().state === 'displaced') return [];

    if (hit.power >= 160) {
      this.forcedMs = 600;
      this.pulledBy = hit.sourceId;
      this.model.impulse();
    } else if (hit.power >= 30) this.nudgeUntil = this.activeTime + 300;

    return [];
  }

  // eslint-disable-next-line max-lines-per-function -- Auflagenverlust legt dieselbe Decke einmalig ab und stellt Bild und Schadenshistorie gemeinsam um.
  releaseSupport(surface: Bounds) {
    if (
      Math.abs(surface.y - this.config.surface.y) > 2 ||
      surface.x + surface.width <= this.config.surface.x ||
      surface.x >= this.config.surface.x + this.config.surface.width
    )
      return;
    const event = this.model.displace();

    if (event) this.history.record(event);
    this.moving = false;
    this.draw();

    return event;
  }

  damageSnapshot() {
    return this.history.snapshot();
  }

  snapshot() {
    return {
      id: this.id,
      ...this.model.snapshot(),
      ...this.history.snapshot(),
      art: this.art.snapshot(),
      pulledBy: this.pulledBy,
    };
  }

  reset() {
    this.model.reset();
    this.history.reset();
    this.forcedMs = 0;
    this.activeTime = 0;
    this.nudgeUntil = 0;
    this.moving = false;
    this.pulledBy = null;
    this.draw();
  }

  destroy() {
    this.art.root.destroy(true);
  }
}
