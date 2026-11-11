import type Phaser from 'phaser';
import type { ImpactBody } from '../domain/impact-world';
import { DamageHistory } from '../domain/chaos-event';
import { CarpetHairball, carpetEligible, type CarpetRules } from '../interactions/carpet-hairball';
import {
  type Bounds,
  type InteractionContext,
  type InteractionResult,
  type Interactable,
  type Destructible,
} from '../interactions/contracts';
export interface CarpetConfig {
  readonly id: string;
  readonly area: Bounds;
  readonly floorY: number;
  readonly rules: CarpetRules;
}
export class Carpet implements Interactable, Destructible {
  readonly id: string;
  readonly maximumScore: number;
  private readonly config: CarpetConfig;
  private readonly model: CarpetHairball;
  private readonly history = new DamageHistory();
  private readonly art: Phaser.GameObjects.Image;
  private readonly hairball: Phaser.GameObjects.Image;
  // eslint-disable-next-line max-lines-per-function -- Teppich und Haarballen teilen denselben Bodenanker und besitzen bewusst keine Physikkörper.
  constructor(scene: Phaser.Scene, config: CarpetConfig) {
    this.config = { ...config, area: { ...config.area }, rules: { ...config.rules } };
    this.id = config.id;
    this.maximumScore = config.rules.points;
    this.model = new CarpetHairball(this.id, config.rules);
    const a = config.area;

    this.art = scene.add
      .image(a.x + a.width / 2, a.y + a.height / 2, 'room-rug')
      .setDisplaySize(a.width, a.height)
      .setDepth(0.1);
    this.hairball = scene.add
      .image(a.x + a.width / 2, config.floorY + 18, 'hairball')
      .setOrigin(0.5, 1)
      .setDepth(0.6)
      .setVisible(false);
  }

  eligible(context: InteractionContext) {
    return carpetEligible(context, this.config.area, this.config.floorY);
  }

  // eslint-disable-next-line max-lines-per-function -- Der erfolgreiche Abschluss setzt Bildanker und Schadensereignis genau einmal gemeinsam.
  update(context: InteractionContext, active: boolean): InteractionResult {
    const event = this.model.update(context.delta, active && this.eligible(context));

    if (event) {
      this.history.record(event);
      const a = this.config.area;

      this.hairball
        .setX(
          Math.max(
            a.x + 18,
            Math.min(
              a.x + a.width - 18,
              context.pixel.x + (context.pixel.x > a.x + a.width / 2 ? -24 : 24),
            ),
          ),
        )
        .setVisible(true);
    }

    const retching = this.model.snapshot().state === 'retching';

    return {
      action: retching ? 'retching' : 'idle',
      faceX: retching ? this.config.area.x + this.config.area.width / 2 : undefined,
      event,
    };
  }

  // eslint-disable-next-line max-lines-per-function -- Der vollständige Kontaktvertrag hält aktuelle Geometrie, Masse und Bewegungszustand zusammen.
  impactBody(): ImpactBody {
    return {
      id: this.id,
      mass: 0.3,
      moving: false,
      enabled: true,
      surface: 'soft',
      bounds: {
        x: this.config.area.x,
        y: this.config.floorY - 2,
        width: this.config.area.width,
        height: 4,
      },
    };
  }

  /** A flat rug absorbs contact; foreign objects cannot trigger Pixel's hairball action. */
  receiveImpact() {
    return [];
  }

  damageSnapshot() {
    return this.history.snapshot();
  }

  // eslint-disable-next-line max-lines-per-function -- Der nur lesbare Snapshot zeigt Zustand, sichtbaren Fleck und tatsächliche Interaktionszone.
  snapshot() {
    return {
      id: this.id,
      ...this.model.snapshot(),
      ...this.history.snapshot(),
      area: { ...this.config.area },
      floorY: this.config.floorY,
      hairballVisible: this.hairball.visible,
      hairballX: this.hairball.x,
      hairballY: this.hairball.y,
      texture: this.art.texture.key,
      hairballTexture: this.hairball.texture.key,
    };
  }

  reset() {
    this.model.reset();
    this.history.reset();
    this.hairball
      .setPosition(this.config.area.x + this.config.area.width / 2, this.config.floorY + 18)
      .setVisible(false);
  }

  destroy() {
    this.art.destroy();
    this.hairball.destroy();
  }
}
