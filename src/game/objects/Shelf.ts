import type Phaser from 'phaser';
import type { ImpactBody, ImpactHit } from '../domain/impact-world';
import type { RoomDefinition, Decoration } from '../content/definitions';
import type { InteractionContext } from '../interactions/contracts';
import { DamageHistory } from '../domain/chaos-event';
import { ShelfStability, shelfWobbleAngle } from '../domain/shelf-stability';
import { ShelfArt } from './shelf-art';
import { StaticFurnitureArt } from './static-furniture-art';

type ShelfDefinition = RoomDefinition['platforms'][number];
type ShelfDecoration = Extract<Decoration, { kind: 'rect' }>;

export class Shelf {
  readonly id: string;
  readonly platform: Phaser.GameObjects.Rectangle;
  private wobbleStartedAt: number | null = null;
  private collapseStartedAt: number | null = null;
  private fallProgress = 0;
  private supportLost = false;
  private readonly model: ShelfStability;
  private readonly history = new DamageHistory();
  private readonly graphic: Phaser.GameObjects.Container;
  private readonly art: ShelfArt | StaticFurnitureArt;
  private readonly decorations: readonly ShelfDecoration[];

  // eslint-disable-next-line max-lines-per-function -- Content, Grafik und unveränderlicher statischer Körper werden für dieselbe Regalfläche gemeinsam erzeugt.
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly definition: ShelfDefinition,
    private readonly floorY: number,
    decorations: readonly Decoration[],
  ) {
    this.id = definition.id;
    this.model = new ShelfStability(this.id, definition.durability ?? { stability: 'stable' });
    const b = definition.bounds;

    this.platform = scene.add.rectangle(
      b.x + b.width / 2,
      b.y + b.height / 2,
      b.width,
      b.height,
      0,
      0,
    );
    scene.physics.add.existing(this.platform, true);
    this.decorations = decorations.filter(
      (d): d is ShelfDecoration => d.kind === 'rect' && d.supportedBy === this.id,
    );
    this.art = definition.appearance
      ? new StaticFurnitureArt(scene, b, floorY, definition.appearance)
      : new ShelfArt(scene, b, this.decorations);
    this.graphic = this.art.root;
    this.draw();
  }

  // eslint-disable-next-line max-lines-per-function -- Landung, einmaliges Ereignis und dazu konsistente Körper-/Bildänderung bilden einen gemeinsamen Zustandsschritt.
  update(pixel: InteractionContext['pixel'], time: number) {
    const previous = this.model.snapshot();
    const before = previous.landings;
    const event = this.model.observe(!pixel.grounded && !pixel.climbing, this.supports(pixel));
    const { state, landings } = this.model.snapshot();

    if (landings > before) this.wobbleStartedAt = time;

    this.warn(previous.state, state);

    if (event) this.history.record(event);
    this.draw();

    if (state === 'collapsed') {
      this.startCollapse(time);
      this.fallProgress = Math.min(1, (time - (this.collapseStartedAt ?? time)) / 550);
      this.graphic
        .setAngle(0)
        .setY(
          this.bounds.y +
            (this.floorY - this.art.debrisBottom - this.bounds.y) * this.fallProgress ** 2,
        );
    } else
      this.graphic.setAngle(
        state === 'intact' || this.wobbleStartedAt === null
          ? 0
          : shelfWobbleAngle(time - this.wobbleStartedAt, state === 'damaged'),
      );

    return event;
  }

  // eslint-disable-next-line max-lines-per-function -- Der vollständige Kontaktvertrag hält aktuelle Geometrie, Masse und Bewegungszustand zusammen.
  impactBody(): ImpactBody {
    const collapsed = this.model.snapshot().state === 'collapsed';

    return {
      id: this.id,
      mass: 6,
      enabled: true,
      surface: 'solid',
      moving: collapsed && this.fallProgress < 1,
      bounds: { ...this.bounds, y: this.graphic.y, height: this.art.boardHeight },
    };
  }

  receiveImpact(hit: ImpactHit) {
    this.wobbleStartedAt = hit.time;
    const events = this.impactEvents(hit.power);

    for (const damage of events) this.history.record(damage);

    if (this.model.snapshot().state === 'collapsed') this.startCollapse(hit.time);

    return events;
  }

  private impactEvents(power: number) {
    if (power >= 1800) return this.model.collapse();
    const event = power >= 600 ? this.model.impact() : undefined;

    return event ? [event] : [];
  }

  private startCollapse(time: number) {
    (this.platform.body as Phaser.Physics.Arcade.StaticBody).enable = false;
    this.collapseStartedAt ??= time;
    this.draw();
  }

  consumeSupportLoss() {
    if (this.supportLost || this.model.snapshot().state !== 'collapsed') return false;
    this.supportLost = true;

    return true;
  }

  private warn(before: string, after: string) {
    if (before !== after && after === 'wobbly') this.scene.events.emit('object-impact', 'creak');
  }

  private supports(p: InteractionContext['pixel']) {
    const b = this.definition.bounds;

    return (
      p.grounded &&
      !p.climbing &&
      Math.abs(p.bottom - b.y) < 2 &&
      p.left + p.bodyWidth > b.x &&
      p.left < b.x + b.width
    );
  }

  get bounds() {
    return this.definition.bounds;
  }

  private draw() {
    this.art.render(this.model.snapshot());
  }

  private artSnapshot() {
    return {
      boardHeight: this.art.boardHeight,
      debrisBoardHeight: this.art.debrisBoardHeight,
      angle: this.graphic.angle,
      y: this.graphic.y,
      fallProgress: this.fallProgress,
      enabled: (this.platform.body as Phaser.Physics.Arcade.StaticBody).enable,
    };
  }

  snapshot() {
    return {
      id: this.id,
      ...this.model.snapshot(),
      ...this.history.snapshot(),
      ...this.artSnapshot(),
    };
  }

  // eslint-disable-next-line max-lines-per-function -- Auflage, Fallbewegung und einmalige Freigabe werden mit Grafik und Schadensmodell gemeinsam zurückgesetzt.
  reset() {
    this.model.reset();
    this.wobbleStartedAt = null;
    this.collapseStartedAt = null;
    this.fallProgress = 0;
    this.supportLost = false;
    this.history.reset();
    (this.platform.body as Phaser.Physics.Arcade.StaticBody).enable = true;
    this.graphic.setAngle(0).setY(this.definition.bounds.y);
    this.draw();
  }

  destroy() {
    this.platform.destroy();
    this.graphic.destroy();
  }
}
