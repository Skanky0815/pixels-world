import { curtainTearPosition, curtainTearSize } from './curtain-tear-position';
import type Phaser from 'phaser';
import type { ImpactBody, ImpactHit } from '../domain/impact-world';
import { motionPreferences } from '../settings/motion';
import { DamageHistory } from '../domain/chaos-event';
import { CURTAIN_SLIDE, CurtainSliding, type TearConfig } from '../interactions/curtain-sliding';
import type {
  Bounds,
  Climbable,
  ClimbGrip,
  Destructible,
  InteractionContext,
} from '../interactions/contracts';

export interface CurtainConfig {
  readonly id: string;
  readonly appearance?: 'rust' | 'khaki';
  readonly area: Bounds;
  readonly rules: TearConfig;
}

export class Curtain implements Climbable, Destructible {
  readonly id: string;
  readonly climbArea: Bounds;
  readonly maximumScore: number;
  private readonly model: CurtainSliding;
  private readonly history = new DamageHistory();
  private readonly graphic: Phaser.GameObjects.Image;
  private readonly marks: Phaser.GameObjects.Container;
  private readonly maximumMarks: number;
  private readonly tearTexture: string;
  private previousY: number | null = null;
  private previousSpeed = 0;
  private nudgeUntil = 0;

  // eslint-disable-next-line max-lines-per-function -- Modell, unveränderliche Kletterfläche und ihre zwei Grafiklayer werden gemeinsam initialisiert.
  constructor(scene: Phaser.Scene, config: CurtainConfig) {
    this.id = config.id;
    this.maximumMarks = config.rules.maxDamage;
    this.tearTexture = config.appearance === 'khaki' ? 'bedroom-curtain-tear' : 'curtain-tear';
    this.model = new CurtainSliding(config.rules, this.id);
    this.climbArea = Object.freeze({ ...config.area });
    this.maximumScore = config.rules.maxDamage * config.rules.damageValue;
    const a = this.climbArea;

    this.graphic = scene.add
      .image(a.x, a.y, config.appearance === 'khaki' ? 'bedroom-curtain' : 'curtain-rust')
      .setOrigin(0, 0)
      .setDisplaySize(a.width, a.height);
    this.marks = scene.add.container().setDepth(0.5);
  }

  // eslint-disable-next-line max-lines-per-function -- Der vollständige skalare Griffvertrag bleibt als ein zusammengehöriger Adapter sichtbar.
  climbGrips(): readonly ClimbGrip[] {
    return [
      {
        id: `${this.id}:fabric`,
        ownerId: this.id,
        kind: 'curtain',
        area: this.climbArea,
        speed: CURTAIN_SLIDE.climbSpeed,
        requireUp: false,
      },
    ];
  }

  // eslint-disable-next-line max-lines-per-function -- Die kurze Folge aus Bewegungsmessung, Modellschritt, Historie und Rissdarstellung bleibt atomar.
  updateClimb(context: InteractionContext, attached: boolean) {
    const p = context.pixel;
    const nudge =
      context.time < this.nudgeUntil && !motionPreferences.snapshot().reduced
        ? Math.sin((this.nudgeUntil - context.time) / 70) * 3
        : 0;

    this.graphic.setX(this.climbArea.x + nudge);
    const state = !attached ? 'detached' : context.input.vertical < 0 ? 'climbing' : 'sliding';
    const movementMs = this.measureDescent(context, state);
    const event = this.model.update(movementMs, state, movementMs > 0 && !p.grounded);

    if (event) {
      this.history.record(event);
      this.drawDamage(context);
    }

    return event;
  }

  private measureDescent(context: InteractionContext, state: string) {
    const p = context.pixel;
    const distance = this.previousY === null ? 0 : p.top - this.previousY;
    const movementMs =
      distance > 0 && this.previousSpeed > 0 ? (distance / this.previousSpeed) * 1000 : 0;

    this.previousY = p.top;
    this.previousSpeed = state === 'sliding' ? p.velocityY : 0;

    return movementMs;
  }

  // eslint-disable-next-line max-lines-per-function -- Kontakt und zur Stoffgröße passende Rissposition werden gemeinsam gewählt.
  private drawDamage(context: InteractionContext) {
    const p = context.pixel;
    const position = curtainTearPosition(
      this.climbArea,
      p.x,
      p.y,
      this.markPositions(),
      this.maximumMarks,
    );

    if (position) this.addMark(position.x, position.y);
  }

  private addMark(x: number, y: number) {
    const size = curtainTearSize(this.climbArea, this.maximumMarks);

    this.marks.add(
      this.graphic.scene.add
        .image(x, y, this.tearTexture)
        .setOrigin(0.5, 0)
        .setDisplaySize(size.width, size.height),
    );
  }

  private markPositions() {
    return this.marks.list.map((mark) => {
      const image = mark as Phaser.GameObjects.Image;

      return { x: image.x, y: image.y };
    });
  }

  impactBody(): ImpactBody {
    return {
      id: this.id,
      bounds: this.climbArea,
      mass: 0.2,
      moving: false,
      enabled: true,
      surface: 'soft',
    };
  }

  receiveImpact(hit: ImpactHit) {
    this.nudgeUntil = hit.time + 600;

    return [];
  }

  damageSnapshot() {
    return this.history.snapshot();
  }

  snapshot() {
    return {
      ...this.model.snapshot(),
      ...this.damageSnapshot(),
      texture: this.graphic.texture.key,
      area: { ...this.climbArea },
      marks: this.markPositions(),
    };
  }

  reset() {
    this.nudgeUntil = 0;
    this.graphic.setX(this.climbArea.x);
    this.model.reset();
    this.history.reset();
    this.previousY = null;
    this.previousSpeed = 0;
    this.marks.removeAll(true);
  }

  destroy() {
    this.graphic.destroy();
    this.marks.destroy();
  }
}
