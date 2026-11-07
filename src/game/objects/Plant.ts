import type Phaser from 'phaser';
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

  private readonly config: PlantObjectConfig;

  // eslint-disable-next-line max-lines-per-function -- Modell und die beiden Bilder werden gemeinsam mit ihren unveränderlichen Bodenankern aufgebaut.
  constructor(scene: Phaser.Scene, config: PlantObjectConfig) {
    this.config = { ...config, reach: { ...config.reach }, rules: { ...config.rules } };
    this.id = config.id;
    this.model = new PlantNibbling(config.rules, this.id);
    this.maximumScore = config.rules.nibbleValue + config.rules.tipValue;
    this.graphic = scene.add.image(config.x, config.floorY, 'catgrass-intact').setOrigin(0.5, 1);
    this.soil = scene.add
      .image(config.x - 8, config.floorY + 1, 'catgrass-soil')
      .setOrigin(0.5, 1)
      .setDepth(0.5)
      .setVisible(false);
  }

  eligible(context: InteractionContext) {
    const p = context.pixel,
      c = this.config;

    return (
      standingStill(context) &&
      p.x >= c.x + c.reach.left &&
      p.x <= c.x + c.reach.right &&
      Math.abs(p.bottom - c.floorY) < 2
    );
  }

  // eslint-disable-next-line max-lines-per-function -- Modellschritt, Schaden, Pose und Aktionsrückgabe bleiben als ein koordinierender Frame-Schritt sichtbar.
  update(context: InteractionContext, active: boolean): InteractionResult {
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
    this.history.record(event);
    this.draw();

    if (event.kind === 'tip') this.tip();
  }

  private tip() {
    const c = this.config;

    this.graphic.setAngle(-80).setPosition(c.x + 10, c.floorY - 17);
    this.soil.setVisible(true);
  }

  private animate(state: string, progress: number, nibbling: boolean, time: number) {
    if (state === 'tipped') return;
    const angle =
      state === 'wobbling'
        ? Math.sin(progress * Math.PI * 8) * (5 + progress * 12)
        : nibbling
          ? Math.sin(time / 80) * 2
          : 0;

    this.graphic.setAngle(angle);
  }

  private draw() {
    this.graphic.setTexture(
      this.model.snapshot().damage > 0 ? 'catgrass-bitten' : 'catgrass-intact',
    );
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

  reset() {
    this.model.reset();
    this.history.reset();
    this.graphic.setAngle(0).setPosition(this.config.x, this.config.floorY);
    this.soil.setVisible(false);
    this.draw();
  }

  destroy() {
    this.graphic.destroy();
    this.soil.destroy();
  }
}
