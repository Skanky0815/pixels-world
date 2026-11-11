import type Phaser from 'phaser';
import type { ImpactBody, ImpactHit } from '../domain/impact-world';
import { PictureFalling, type PictureRules } from '../interactions/picture-falling';
import {
  overlaps,
  type Bounds,
  type InteractionContext,
  type Interactable,
  type Destructible,
} from '../interactions/contracts';
import { DamageHistory } from '../domain/chaos-event';
import { motionPreferences } from '../../settings/motion';
import type { PictureMotif } from '../assets/picture-appearance';
export interface WallPictureConfig {
  readonly id: string;
  readonly area: Bounds;
  readonly floorY: number;
  readonly appearance: PictureMotif;
  readonly rules: PictureRules;
}
export class WallPicture implements Interactable, Destructible {
  readonly id: string;
  readonly maximumScore: number;
  private readonly model: PictureFalling;
  private readonly history = new DamageHistory();
  private readonly art: Phaser.GameObjects.Image;
  // eslint-disable-next-line max-lines-per-function -- Modell und transparente PNG teilen denselben unveränderlichen Wandanker.
  constructor(
    scene: Phaser.Scene,
    private readonly config: WallPictureConfig,
  ) {
    this.id = config.id;
    this.maximumScore = config.rules.points;
    this.model = new PictureFalling(this.id, config.rules);
    this.art = scene.add
      .image(
        config.area.x + config.area.width / 2,
        config.area.y + config.area.height / 2,
        `picture-${config.appearance}`,
      )
      .setDepth(0.4);
    this.draw();
  }

  eligible(context: InteractionContext) {
    return overlaps(context.pixel, this.config.area);
  }

  // eslint-disable-next-line max-lines-per-function -- Kontaktbeobachtung, einmaliger Aufprall und dazugehöriges Bild bleiben ein gemeinsamer Schritt.
  update(context: InteractionContext, active: boolean) {
    const event = this.model.update(context.delta, {
      ...context.pixel,
      touching: active && this.eligible(context),
    });

    if (event) {
      this.history.record(event);
    }

    this.draw();

    return { action: 'idle' as const, event };
  }

  // eslint-disable-next-line max-lines-per-function -- Wackeln und Fall interpolieren dasselbe PNG; die projizierte Unterkante endet auf dem Boden ohne Collider.
  private draw() {
    const { state, progress, wobble } = this.model.snapshot();
    const area = this.config.area;
    const p = state === 'fallen' ? 1 : progress;
    const height = area.height + (26 - area.height) * p;
    const angle = state === 'straight' ? 0 : -12 + 4 * p;
    const shake = motionPreferences.snapshot().reduced
      ? 0
      : Math.sin(wobble * Math.PI * 8) * wobble * 7;
    const radians = (angle * Math.PI) / 180;
    const bottomExtent =
      (Math.abs(area.width * Math.sin(radians)) + Math.abs(height * Math.cos(radians))) / 2;
    const startY = area.y + area.height / 2;

    this.art
      .setDisplaySize(area.width, height)
      .setAngle(angle + shake)
      .setY(startY + (this.config.floorY - bottomExtent - startY) * p * p);
  }

  // eslint-disable-next-line max-lines-per-function -- Der vollständige Kontaktvertrag hält aktuelle Geometrie, Masse und Bewegungszustand zusammen.
  impactBody(): ImpactBody {
    const b = this.art.getBounds();

    return {
      id: this.id,
      mass: 1.5,
      enabled: true,
      surface: 'loose',
      moving: this.model.snapshot().state === 'falling',
      bounds: { x: b.x, y: b.y, width: b.width, height: b.height },
    };
  }

  receiveImpact(hit: ImpactHit) {
    if (hit.power >= 35) this.model.impact(hit.power >= 180);

    return [];
  }

  damageSnapshot() {
    return this.history.snapshot();
  }

  // eslint-disable-next-line max-lines-per-function -- Der nur lesbare Snapshot enthält Zustand, Wertung und tatsächliche PNG-Darstellung gemeinsam.
  snapshot() {
    return {
      id: this.id,
      motif: this.config.appearance,
      ...this.model.snapshot(),
      ...this.history.snapshot(),
      x: this.art.x,
      y: this.art.y,
      angle: this.art.angle,
      texture: this.art.texture.key,
      displayWidth: this.art.displayWidth,
      displayHeight: this.art.displayHeight,
    };
  }

  reset() {
    this.model.reset();
    this.history.reset();
    this.draw();
  }

  destroy() {
    this.art.destroy();
  }
}
