import type Phaser from 'phaser';
import { DamageHistory } from '../domain/chaos-event';
import type { ImpactBody, ImpactHit } from '../domain/impact-world';
import { TableclothPull, type TableclothRules } from '../interactions/tablecloth-pulling';
import {
  overlaps,
  type Bounds,
  type InteractionContext,
  type Climbable,
  type ClimbGrip,
} from '../interactions/contracts';
import { TableclothArt } from './tablecloth-art';
export interface TableclothConfig {
  readonly id: string;
  readonly surface: Bounds;
  readonly floorY: number;
  readonly hang: number;
  readonly rules: TableclothRules;
}
export class Tablecloth implements Climbable {
  readonly id: string;
  readonly maximumScore: number;
  private readonly model: TableclothPull;
  private readonly history = new DamageHistory();
  private readonly art: TableclothArt;
  private forcedMs = 0;
  private activeTime = 0;
  private nudgeUntil = 0;
  private moving = false;
  private velocityX = 0;
  private pullSide = 1;
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

  get climbSpeed() {
    return this.config.rules.climbSpeed;
  }

  // eslint-disable-next-line max-lines-per-function -- Der vollständige skalare Griffvertrag bleibt als ein zusammengehöriger Adapter sichtbar.
  climbGrips(): readonly ClimbGrip[] {
    return this.climbAreas().map(({ side, area }) => ({
      id: `${this.id}:${side}`,
      ownerId: this.id,
      kind: 'tablecloth',
      area,
      speed: this.climbSpeed,
      requireUp: true,
      side,
      faceX: area.x + area.width / 2,
    }));
  }

  // eslint-disable-next-line max-lines-per-function -- Die zwei getrennten Greifbereiche folgen den tatsächlichen sichtbaren Überhängen und bleiben über dem Boden.
  climbAreas() {
    const s = this.config.surface,
      state = this.model.snapshot();

    if (state.state === 'displaced') return [];

    return ([-1, 1] as const).flatMap((side) => {
      const height = Math.max(
        0,
        Math.min(this.config.floorY - s.y - 24, this.config.hang + side * state.offset),
      );

      return height > 0
        ? [{ side, area: { x: s.x + (side > 0 ? s.width : 0) - 12, y: s.y, width: 24, height } }]
        : [];
    });
  }

  eligible(context: InteractionContext) {
    return (
      context.pixel.climbing && this.climbAreas().some((grip) => overlaps(context.pixel, grip.area))
    );
  }

  // eslint-disable-next-line max-lines-per-function, complexity -- Aktive Zeit, tatsächlicher Stoffweg, einmaliger Schaden und der gemeinsame Oberflächenzug bilden einen atomaren Frame.
  update(context: InteractionContext, active: boolean, side = 1) {
    const delta = Number.isFinite(context.delta) ? Math.max(0, context.delta) : 0;

    this.activeTime += delta;
    const before = this.model.snapshot();
    const touching = active && this.eligible(context);

    if (touching) this.pullSide = side;
    const event = this.model.update(delta, touching || this.forcedMs > 0, this.pullSide);

    this.forcedMs = Math.max(0, this.forcedMs - delta);
    const after = this.model.snapshot();
    const dx = after.offset - before.offset;

    this.moving = dx !== 0 && after.state !== 'displaced';

    this.velocityX = delta > 0 ? (dx * 1000) / delta : 0;

    if (touching && dx !== 0) this.pulledBy ??= 'pixel';

    if (event) this.history.record(event);
    this.draw();

    return {
      event,
      drag:
        dx !== 0
          ? {
              dx,
              surface: this.config.surface,
              area: {
                x: this.config.surface.x + Math.max(0, before.offset),
                y: this.config.surface.y - 2,
                width: Math.max(0, this.config.surface.width - Math.abs(before.offset)),
                height: 4,
              },
            }
          : null,
    };
  }

  private draw() {
    this.art.render(
      this.model.snapshot(),
      this.activeTime,
      this.activeTime < this.nudgeUntil,
      this.pullSide,
    );
  }

  // eslint-disable-next-line max-lines-per-function -- Der flache reale Tischkantenkontakt bleibt ohne unsichtbaren Körper unter dem Tisch vollständig sichtbar.
  impactBody(): ImpactBody {
    const s = this.config.surface,
      state = this.model.snapshot();

    return {
      id: this.id,
      bounds: {
        x: s.x + Math.max(0, Math.min(state.offset, s.width)),
        y: s.y - 2,
        width: Math.max(1, s.width - Math.abs(state.offset)),
        height: 4,
      },
      mass: 2,
      enabled: state.state !== 'displaced',
      moving: this.moving,
      surface: 'soft',
      velocityX: this.moving ? this.velocityX : 0,
    };
  }

  receiveImpact(hit: ImpactHit) {
    if (hit.counter || this.model.snapshot().state === 'displaced') return [];

    if (hit.power >= 160) {
      this.forcedMs = 600;
      this.pullSide = hit.direction < 0 ? -1 : 1;
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
    const event = this.model.displace(this.pullSide);

    if (event) this.history.record(event);
    this.moving = false;
    this.draw();

    return event;
  }

  damageSnapshot() {
    return this.history.snapshot();
  }

  // eslint-disable-next-line max-lines-per-function -- Zustand, Richtung und zwei losgelöste Greifbereiche bleiben als vollständiger Beobachtungsvertrag sichtbar.
  snapshot() {
    return {
      id: this.id,
      ...this.model.snapshot(),
      ...this.history.snapshot(),
      art: this.art.snapshot(),
      pulledBy: this.pulledBy,
      pullSide: this.pullSide,
      climbAreas: this.climbAreas(),
    };
  }

  // eslint-disable-next-line max-lines-per-function -- Zugrichtung, fremde Anstöße, Historie und beide Stoffenden kehren gemeinsam zum Anfang zurück.
  reset() {
    this.model.reset();
    this.history.reset();
    this.forcedMs = 0;
    this.activeTime = 0;
    this.nudgeUntil = 0;
    this.moving = false;
    this.velocityX = 0;
    this.pullSide = 1;
    this.pulledBy = null;
    this.draw();
  }

  destroy() {
    this.art.root.destroy(true);
  }
}
