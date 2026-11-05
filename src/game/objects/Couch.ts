import type Phaser from 'phaser';
import { PIXEL_ANIMATIONS } from '../actors/pixel-animations';
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
}

export class Couch implements Interactable, Destructible {
  readonly id: string;
  readonly platform: Phaser.GameObjects.Rectangle;
  readonly maximumScore: number;
  private readonly model: CouchScratching;
  private readonly history = new DamageHistory();
  private readonly graphic: Phaser.GameObjects.Graphics;
  private readonly marks: Phaser.GameObjects.Graphics;
  private readonly paws: Phaser.GameObjects.Graphics;

  private readonly config: CouchConfig;

  // eslint-disable-next-line max-lines-per-function -- Die deklarative Sofageometrie und ihre dazu passende Plattform werden gemeinsam aufgebaut.
  constructor(scene: Phaser.Scene, config: CouchConfig) {
    this.config = { ...config, seat: { ...config.seat }, rules: { ...config.rules } };
    this.id = config.id;
    this.model = new CouchScratching(config.rules, this.id);
    this.maximumScore = config.rules.maxDamage * config.rules.damageValue;
    const { x, y, width: w, height: h } = config.seat;

    this.graphic = scene.add.graphics();
    const rect = (dx: number, dy: number, width: number, height: number, color: number) =>
      this.graphic.fillStyle(color).fillRect(x + dx, y + dy, width, height);

    rect(10, -60, w - 22, 65, 0x687a63);
    rect(18, -52, (w - 46) / 2, 46, 0x809077);
    rect(w / 2 + 3, -52, (w - 46) / 2, 46, 0x809077);
    rect(0, 0, w, h, 0x93a184);
    rect(0, h, w, 32, 0x596d57);
    rect(-8, -22, 24, 69, 0x72866b);
    rect(w - 16, -22, 24, 69, 0x72866b);
    rect(12, 60, 12, config.floorY - y - 60, 0x59443d);
    rect(w - 24, 60, 12, config.floorY - y - 60, 0x59443d);
    rect(38, -35, 47, 32, 0xd7ab71);
    this.platform = scene.add.rectangle(x + w / 2, y + h / 2, w, h, 0, 0);
    scene.physics.add.existing(this.platform, true);
    this.marks = scene.add.graphics();
    this.paws = scene.add.graphics();
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
    const event = this.model.update(context.delta, active && this.eligible(context));

    if (event) this.drawDamage(context, event);

    this.paws.clear();
    const scratching = this.model.snapshot().state === 'scratching';

    if (scratching) this.drawPaws(context);

    return {
      action: scratching ? 'scratching' : 'idle',
      faceX: scratching ? s.x + s.width / 2 : undefined,
      event,
    };
  }

  // eslint-disable-next-line max-lines-per-function -- Die begrenzten Koordinaten und drei zusammengehörigen Kratzlinien bleiben in einer Zeichenroutine.
  private drawDamage(context: InteractionContext, event: NonNullable<InteractionResult['event']>) {
    const p = context.pixel,
      s = this.config.seat;

    this.history.record(event);
    const x = Math.max(
      s.x + 4,
      Math.min(
        p.x + (p.x > s.x + s.width / 2 ? -12 : 12) + (event.stage % 3) * 3,
        s.x + s.width - 8,
      ),
    );
    const y = p.bottom > s.y + s.height + 2 ? s.y + s.height + 10 : s.y - 39;

    this.marks.lineStyle(2, 0xe3cba4);

    for (let i = 0; i < 3; i++)
      this.marks.lineBetween(x + i * 4, y, x + i * 4 - 4, y + 15 + event.stage);
  }

  // eslint-disable-next-line max-lines-per-function -- Die gemeinsamen Posenparameter und beiden Pfotenlinien bleiben zusammen lesbar.
  private drawPaws(context: InteractionContext) {
    const p = context.pixel,
      s = this.config.seat;
    const scale = PIXEL_ANIMATIONS.scratch.scale;
    const direction = p.x > s.x + s.width / 2 ? -1 : 1;
    const lift = p.animationFrame % 2 === 0 ? 0 : 6;
    const pawY = p.bottom - 16 * scale;

    this.paws.lineStyle(3, 0xe3cba4);

    for (let i = 0; i < 2; i++)
      this.paws.lineBetween(
        p.x + direction * 9 * scale,
        pawY - 4 + i * 4,
        p.x + direction * 20 * scale,
        pawY - (p.bottom > s.y + s.height + 2 ? 35 : 20) + lift + i * 4,
      );
  }

  damageSnapshot() {
    return this.history.snapshot();
  }

  snapshot() {
    return { ...this.model.snapshot(), ...this.damageSnapshot() };
  }

  reset() {
    this.model.reset();
    this.history.reset();
    this.marks.clear();
    this.paws.clear();
  }

  destroy() {
    this.platform.destroy();
    this.graphic.destroy();
    this.marks.destroy();
    this.paws.destroy();
  }
}
