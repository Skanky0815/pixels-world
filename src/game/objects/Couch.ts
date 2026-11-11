import { couchScratchPosition, couchScratchScale } from './couch-scratch-position';
import type Phaser from 'phaser';
import type { ImpactBody, ImpactHit } from '../domain/impact-world';
import { motionPreferences } from '../../settings/motion';
import type { CouchAppearance } from '../assets/couch-appearance';
import { DamageHistory } from '../domain/chaos-event';
import { CouchScratching, type ScratchConfig } from '../interactions/couch-scratching';
import {
  standingStill,
  type Bounds,
  type Destructible,
  type Interactable,
  type InteractionContext,
  type InteractionResult,
} from '../interactions/contracts';

export interface CouchConfig {
  readonly id: string;
  readonly seat: Bounds;
  readonly floorY: number;
  readonly reach: number;
  readonly rules: ScratchConfig;
  readonly appearance?: CouchAppearance;
}

export class Couch implements Interactable, Destructible {
  readonly id: string;
  readonly platform: Phaser.GameObjects.Rectangle;
  readonly maximumScore: number;
  private readonly model: CouchScratching;
  private readonly history = new DamageHistory();
  private readonly graphic: Phaser.GameObjects.Image;
  private readonly marks: Phaser.GameObjects.Container;

  private readonly config: CouchConfig;
  private nudgeUntil = 0;

  // eslint-disable-next-line max-lines-per-function -- Die deklarative Sofageometrie und ihre dazu passende Plattform werden gemeinsam aufgebaut.
  constructor(scene: Phaser.Scene, config: CouchConfig) {
    this.config = { ...config, seat: { ...config.seat }, rules: { ...config.rules } };
    this.id = config.id;
    this.model = new CouchScratching(config.rules, this.id);
    this.maximumScore = config.rules.maxDamage * config.rules.damageValue;
    const { x, y, width: w, height: h } = config.seat;

    this.graphic = scene.add
      .image(x - 8, y - 60, `couch-${config.appearance ?? 'cozy'}`)
      .setOrigin(0, 0)
      .setDisplaySize(w + 18, config.floorY - y + 60);
    this.platform = scene.add.rectangle(x + w / 2, y + h / 2, w, h, 0, 0);
    scene.physics.add.existing(this.platform, true);
    this.marks = scene.add.container().setDepth(0.5);
  }

  // eslint-disable-next-line max-lines-per-function -- Die zusammengehörige Boden-/Sitzflächen- und Reichweitenprüfung bleibt als ein räumliches Prädikat sichtbar.
  eligible(context: InteractionContext) {
    const p = context.pixel,
      s = this.config.seat;
    const onSurface =
      Math.abs(p.bottom - this.config.floorY) < 2 ||
      (p.x >= s.x && p.x <= s.x + s.width && Math.abs(p.bottom - s.y) < 2);

    return (
      standingStill(context) &&
      p.x >= s.x - this.config.reach &&
      p.x <= s.x + s.width + this.config.reach &&
      onSurface
    );
  }

  // eslint-disable-next-line max-lines-per-function -- Modellschritt, Schadensdarstellung und Aktionsrückgabe bilden einen Frame-Schritt; Zeichenroutinen sind ausgelagert.
  update(context: InteractionContext, active: boolean): InteractionResult {
    const s = this.config.seat;
    const nudge =
      context.time < this.nudgeUntil && !motionPreferences.snapshot().reduced
        ? Math.sin((this.nudgeUntil - context.time) / 50)
        : 0;

    this.graphic.setAngle(nudge);
    const event = this.model.update(context.delta, active && this.eligible(context));

    if (event) this.drawDamage(context, event);

    const scratching = this.model.snapshot().state === 'scratching';

    return {
      action: scratching ? 'scratching' : 'idle',
      faceX: scratching ? s.x + s.width / 2 : undefined,
      event,
    };
  }

  private drawDamage(context: InteractionContext, event: NonNullable<InteractionResult['event']>) {
    const p = context.pixel;
    const position = couchScratchPosition(this.config.seat, p.x, p.bottom, this.markPositions());

    this.history.record(event);

    if (position) this.addMark(position.x, position.y);
  }

  private addMark(x: number, y: number) {
    this.marks.add(
      this.graphic.scene.add
        .image(x, y, 'couch-scratch')
        .setOrigin(0.5, 0)
        .setScale(couchScratchScale(this.config.seat.width)),
    );
  }

  private markPositions() {
    return this.marks.list.map((mark) => {
      const image = mark as Phaser.GameObjects.Image;

      return { x: image.x, y: image.y };
    });
  }

  private artSnapshot() {
    const body = this.platform.body as Phaser.Physics.Arcade.StaticBody;

    return {
      texture: this.graphic.texture.key,
      bodyWidth: body.width,
      bodyHeight: body.height,
      marks: this.markPositions(),
    };
  }

  // eslint-disable-next-line max-lines-per-function -- Der vollständige Kontaktvertrag hält aktuelle Geometrie, Masse und Bewegungszustand zusammen.
  impactBody(): ImpactBody {
    const s = this.config.seat;

    return {
      id: this.id,
      mass: 8,
      moving: false,
      enabled: true,
      surface: 'soft',
      bounds: { x: s.x, y: s.y - 50, width: s.width, height: this.config.floorY - s.y + 50 },
    };
  }

  receiveImpact(hit: ImpactHit) {
    this.nudgeUntil = hit.time + 400;

    return [];
  }

  damageSnapshot() {
    return this.history.snapshot();
  }

  snapshot() {
    return { ...this.model.snapshot(), ...this.damageSnapshot(), ...this.artSnapshot() };
  }

  reset() {
    this.nudgeUntil = 0;
    this.graphic.setAngle(0);
    this.model.reset();
    this.history.reset();
    this.marks.removeAll(true);
  }

  destroy() {
    this.platform.destroy();
    this.graphic.destroy();
    this.marks.destroy();
  }
}
