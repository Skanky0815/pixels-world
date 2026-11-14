import { PlantSupport } from '../interactions/plant-support';
import { plantTexture, type PlantAppearance } from '../assets/plant-appearance';
import type { Bounds } from '../interactions/contracts';
import type Phaser from 'phaser';
import type { ImpactBody, ImpactHit } from '../domain/impact-world';
import { motionPreferences } from '../../settings/motion';
import { DamageHistory } from '../domain/chaos-event';
import { PlantNibbling, type PlantConfig } from '../interactions/plant-nibbling';
import {
  standingStill,
  type Destructible,
  type Interactable,
  type InteractionContext,
  type InteractionResult,
} from '../interactions/contracts';

export interface PlantObjectConfig {
  readonly id: string;
  readonly x: number;
  readonly floorY: number;
  readonly support?: Bounds;
  readonly roomWidth?: number;
  readonly appearance?: PlantAppearance;
  readonly reach: { readonly left: number; readonly right: number };
  readonly rules: PlantConfig;
}

export class Plant implements Interactable, Destructible {
  readonly id: string;
  readonly maximumScore: number;
  private readonly model: PlantNibbling;
  private readonly history = new DamageHistory();
  private readonly graphic: Phaser.GameObjects.Image;
  private readonly soil: Phaser.GameObjects.Image;

  private readonly support: PlantSupport;
  private readonly config: PlantObjectConfig;
  private hasBite = false;
  private activeTime = 0;
  private tipUntil = 0;
  private nudgeUntil = 0;

  // eslint-disable-next-line max-lines-per-function -- Modell und die beiden Bilder werden gemeinsam mit ihren unveränderlichen Bodenankern aufgebaut.
  constructor(scene: Phaser.Scene, config: PlantObjectConfig) {
    this.config = { ...config, reach: { ...config.reach }, rules: { ...config.rules } };
    this.id = config.id;
    this.support = new PlantSupport(
      config.x,
      config.support ?? { x: 0, y: config.floorY, width: config.roomWidth ?? 960, height: 1 },
      { x: 0, y: config.floorY, width: config.roomWidth ?? 960, height: 1 },
    );
    this.model = new PlantNibbling(config.rules, this.id);
    this.maximumScore = config.rules.nibbleValue + config.rules.tipValue;
    this.graphic = scene.add
      .image(
        config.x,
        this.support.snapshot().y,
        plantTexture(config.appearance ?? 'catgrass', false),
      )
      .setOrigin(0.5, 1);
    this.soil = scene.add
      .image(config.x - 8, config.floorY + 1, 'catgrass-soil')
      .setOrigin(0.5, 1)
      .setDepth(0.5)
      .setVisible(false);
    this.placeSoil();
  }

  // eslint-disable-next-line max-lines-per-function -- Stillstand, Reichweite und tatsächliche Auflage bilden gemeinsam den Kontaktvertrag.
  eligible(context: InteractionContext) {
    const p = context.pixel,
      c = this.config;

    return (
      !this.support.snapshot().dropping &&
      standingStill(context) &&
      p.x >= c.x + c.reach.left &&
      p.x <= c.x + c.reach.right &&
      Math.abs(p.bottom - this.support.snapshot().y) < 2
    );
  }

  // eslint-disable-next-line max-lines-per-function -- Modellschritt, Schaden, Pose und Aktionsrückgabe bleiben als ein koordinierender Frame-Schritt sichtbar.
  update(context: InteractionContext, active: boolean): InteractionResult {
    this.activeTime = context.time;
    this.support.advance(context.delta);
    this.placeOnSupport();
    const event = this.model.update(context.delta, active && this.eligible(context));

    if (event) this.applyDamage(event);
    const { state, progress } = this.model.snapshot();
    const nibbling = state === 'nibbling' || state === 'wobbling';

    this.animate(state, progress, nibbling, context.time);

    return {
      action: nibbling ? state : 'idle',
      faceX: nibbling ? this.config.x : undefined,
      event,
    };
  }

  private applyDamage(event: NonNullable<InteractionResult['event']>) {
    if (event.kind === 'nibble') this.hasBite = true;
    this.history.record(event);
    this.draw();

    if (event.kind === 'tip') this.tip();
  }

  private tip() {
    const c = this.config;

    this.tipUntil = this.activeTime + 350;
    this.graphic.setAngle(-80).setPosition(c.x + 10, this.support.snapshot().y - 17);
    this.placeSoil();
    this.soil.setVisible(true);
  }

  // eslint-disable-next-line max-lines-per-function -- Nibbelpose und fremder Stoß teilen denselben aktiven Zeitanker und dieselbe Grafik.
  private animate(state: string, progress: number, nibbling: boolean, time: number) {
    if (state === 'tipped') return;
    const angle =
      state === 'wobbling'
        ? Math.sin(progress * Math.PI * 8) * (5 + progress * 12)
        : nibbling
          ? Math.sin(time / 80) * 2
          : 0;

    const nudge =
      time < this.nudgeUntil && !motionPreferences.snapshot().reduced
        ? Math.sin((this.nudgeUntil - time) / 45) * 4
        : 0;

    this.graphic.setAngle(motionPreferences.snapshot().reduced ? 0 : angle + nudge);
  }

  private draw() {
    this.graphic.setTexture(plantTexture(this.config.appearance ?? 'catgrass', this.hasBite));
  }

  // eslint-disable-next-line max-lines-per-function -- Der vollständige Kontaktvertrag hält aktuelle Geometrie, Masse und Bewegungszustand zusammen.
  impactBody(): ImpactBody {
    const b = this.graphic.getBounds();

    return {
      id: this.id,
      mass: 1.2,
      enabled: true,
      surface: 'loose',
      moving: this.support.snapshot().dropping || this.activeTime < this.tipUntil,
      velocityY: this.support.snapshot().velocityY,
      velocityX: this.activeTime < this.tipUntil ? -80 : 0,
      bounds: { x: b.x, y: b.y, width: b.width, height: b.height },
    };
  }

  receiveImpact(hit: ImpactHit) {
    this.nudgeUntil = this.activeTime + 400;
    const event = hit.power >= 200 ? this.model.tip() : undefined;

    if (event) this.applyDamage(event);

    return event ? [event] : [];
  }

  releaseSupport(surface: Bounds) {
    if (!this.support.release(surface)) return;
    const event = this.model.tip();

    if (event) this.applyDamage(event);

    return event;
  }

  private placeSoil() {
    const soil = this.support.soil();

    this.soil.setPosition(soil.x, soil.y).setDisplaySize(soil.width, 10);
  }

  private placeOnSupport() {
    const tipped = this.model.snapshot().state === 'tipped';

    this.graphic.setPosition(
      this.config.x + (tipped ? 10 : 0),
      this.support.snapshot().y - (tipped ? 17 : 0),
    );
    this.placeSoil();
  }

  // eslint-disable-next-line max-lines-per-function -- Nur lesbare Grafik-, Boden- und Auflagendaten bleiben als flacher Beobachtungsvertrag zusammen.
  supportedSnapshot() {
    const support = this.support.snapshot();

    return {
      id: this.id,
      appearance: this.config.appearance ?? 'catgrass',
      ...this.snapshot(),
      dropping: support.dropping,
      velocityY: support.velocityY,
      floorY: this.config.floorY,
      supportY: support.y,
      soilX: this.soil.x,
      soilY: this.soil.y,
      soilWidth: this.soil.displayWidth,
    };
  }

  damageSnapshot() {
    return this.history.snapshot();
  }

  private artSnapshot() {
    return {
      angle: this.graphic.angle,
      texture: this.graphic.texture.key,
      soilVisible: this.soil.visible,
      x: this.graphic.x,
      y: this.graphic.y,
    };
  }

  snapshot() {
    return { ...this.model.snapshot(), ...this.damageSnapshot(), ...this.artSnapshot() };
  }

  // eslint-disable-next-line max-lines-per-function -- Modell, Fall, Grafik und Schadenshistorie werden gemeinsam auf denselben Spawn zurückgesetzt.
  reset() {
    this.hasBite = false;
    this.activeTime = 0;
    this.support.reset();
    this.tipUntil = 0;
    this.nudgeUntil = 0;
    this.model.reset();
    this.history.reset();
    this.graphic.setAngle(0).setPosition(this.config.x, this.support.snapshot().y);
    this.placeSoil();
    this.soil.setVisible(false);
    this.draw();
  }

  destroy() {
    this.graphic.destroy();
    this.soil.destroy();
  }
}
