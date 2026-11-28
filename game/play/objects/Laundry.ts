import type Phaser from 'phaser';
import { DamageHistory } from '../domain/chaos-event';
import type { ImpactBody, ImpactHit } from '../domain/impact-world';
import { LaundryMotion, type LaundryAppearance } from '../interactions/laundry';
import type { TopplingRules } from '../interactions/toppling';
import {
  overlaps,
  type Bounds,
  type InteractionContext,
  type InteractionResult,
} from '../interactions/contracts';
import { motionPreferences } from '../settings/motion';
import { LaundryArt } from './laundry-art';

export interface LaundryConfig {
  readonly id: string;
  readonly x: number;
  readonly supportY: number;
  readonly floorY: number;
  readonly roomWidth: number;
  readonly travelLeft: number;
  readonly travelRight: number;
  readonly spillX: number;
  readonly appearance: LaundryAppearance;
  readonly rules: TopplingRules;
}

/** Kinematic soft objects share the existing spatial contact and damage pipeline. */
export class Laundry {
  readonly id: string;
  readonly maximumScore: number;
  private readonly model: LaundryMotion;
  private readonly history = new DamageHistory();
  private readonly art: LaundryArt;
  private occupied = false;
  private velocityX = 0;
  private direction = 1;
  private dropping = false;
  private nudgeMs = 0;
  private toppledBy: string | null = null;

  constructor(
    scene: Phaser.Scene,
    private readonly config: LaundryConfig,
  ) {
    this.id = config.id;
    this.maximumScore = config.rules.points * 2;
    this.model = new LaundryMotion(config.id, config.rules);
    this.art = new LaundryArt(scene, config.appearance);
    this.reset();
  }

  eligible(context: InteractionContext) {
    return overlaps(context.pixel, this.impactBody().bounds);
  }

  // eslint-disable-next-line max-lines-per-function, complexity -- Echte Landung, freier Ausstieg, Stoffkontakt und begrenzte Bewegung verwenden ausschließlich die aktive Simulationszeit.
  update(context: InteractionContext, active: boolean): InteractionResult {
    const touching = active && this.eligible(context);
    const p = context.pixel;
    const basket = this.config.appearance === 'basket';

    if (this.occupied && (!touching || context.input.jumpPressed)) this.occupied = false;
    else if (basket && touching && !p.grounded && p.velocityY > 0 && p.bottom < this.art.root.y - 8)
      this.occupied = true;
    const moving = Math.abs(p.velocityX) > 1;
    const disturbing = touching && moving && (!basket || this.occupied);
    const event = this.model.advance(
      context.delta,
      disturbing || (basket && this.model.snapshot().stage === 1),
    );

    if (event) this.history.record(event);
    const state = this.model.snapshot();

    if (disturbing) this.direction = Math.sign(p.velocityX);
    this.velocityX =
      basket && state.stage < 2
        ? this.occupied && moving
          ? p.velocityX
          : state.stage === 1
            ? this.direction * 110
            : 0
        : 0;

    if (!basket && state.stage === 2 && this.art.root.y < this.config.floorY) {
      this.velocityX = this.art.root.x < this.config.spillX ? 130 : 0;
      this.dropping = this.art.root.x >= this.config.spillX;
    }

    this.move(context.delta);
    this.nudgeMs = Math.max(0, this.nudgeMs - Math.max(0, context.delta));
    this.art.render(
      state.stage,
      state.progress + this.nudgeMs / 200,
      motionPreferences.snapshot().reduced,
    );

    return { action: 'idle', event };
  }

  // eslint-disable-next-line max-lines-per-function -- Raumgrenze und verlorene Auflage begrenzen die reale kinematische Bewegung.
  private move(delta: number) {
    const seconds = Number.isFinite(delta) ? Math.max(0, delta) / 1000 : 0;

    const oldX = this.art.root.x;

    this.art.root.x = Math.max(
      this.config.travelLeft,
      Math.min(this.config.travelRight, this.art.root.x + this.velocityX * seconds),
    );

    if (this.art.root.x === oldX) this.velocityX = 0;

    if (this.dropping) {
      this.art.root.y = Math.min(this.config.floorY, this.art.root.y + 240 * seconds);
      this.dropping = this.art.root.y < this.config.floorY;
    }
  }

  // eslint-disable-next-line max-lines-per-function -- Nur die tatsächlich getragene Wäsche verliert ihre Auflage.
  releaseSupport(surface: Bounds) {
    const b = this.impactBody().bounds;

    if (
      Math.abs(this.art.root.y - surface.y) > 2 ||
      b.x >= surface.x + surface.width ||
      b.x + b.width <= surface.x
    )
      return;
    this.dropping = true;
    this.model.knockOver();
  }

  // eslint-disable-next-line max-lines-per-function -- Stoff dämpft Rückstöße; rollende Körbe und fallende Wäsche geben ihre tatsächliche Bewegung weiter.
  impactBody(): ImpactBody {
    const width =
      this.model.snapshot().stage === 2 ? 152 : this.config.appearance === 'basket' ? 80 : 96;

    return {
      id: this.id,
      bounds: { x: this.art.root.x - width / 2, y: this.art.root.y - 48, width, height: 48 },
      mass: this.config.appearance === 'basket' ? 2 : 1,
      surface: 'soft',
      enabled: true,
      moving: this.velocityX !== 0 || this.dropping,
      velocityX: this.velocityX,
      velocityY: this.dropping ? 240 : 0,
    };
  }

  receiveImpact(hit: ImpactHit) {
    if (hit.power >= 30 && this.model.snapshot().stage < 2) this.nudgeMs = 200;

    if (hit.power >= 90 && this.model.knockOver()) {
      this.direction = hit.direction;
      this.toppledBy = hit.sourceId;
    }

    return [];
  }

  damageSnapshot() {
    return this.history.snapshot();
  }

  // eslint-disable-next-line max-lines-per-function -- Der losgelöste Beobachtungsvertrag zeigt Kontaktursache, Bewegung und einmalige Schadensstufen zusammen.
  snapshot() {
    const model = this.model.snapshot();

    return {
      id: this.id,
      appearance: this.config.appearance,
      ...model,
      ...this.history.snapshot(),
      x: this.art.root.x,
      y: this.art.root.y,
      velocityX: this.velocityX,
      occupied: this.occupied,
      dropping: this.dropping,
      toppledBy: this.toppledBy,
      state:
        model.stage === 2
          ? 'spilled'
          : model.stage === 1
            ? 'rumpled'
            : this.occupied
              ? 'occupied'
              : 'intact',
    };
  }

  // eslint-disable-next-line max-lines-per-function -- Reset stellt beide Schadensstufen samt Bewegung und Besetzung gemeinsam zurück.
  reset() {
    this.model.reset();
    this.history.reset();
    this.occupied = false;
    this.velocityX = 0;
    this.direction = 1;
    this.dropping = false;
    this.nudgeMs = 0;
    this.toppledBy = null;
    this.art.root.setPosition(this.config.x, this.config.supportY);
    this.art.render(0, 0, true);
  }

  destroy() {
    this.art.root.destroy(true);
  }
}
