import type Phaser from 'phaser';
import type { RoomDefinition, Decoration } from '../content/definitions';
import type { InteractionContext } from '../interactions/contracts';
import { DamageHistory } from '../domain/chaos-event';
import { ShelfStability, shelfWobbleAngle } from '../domain/shelf-stability';
import { ShelfArt } from './shelf-art';

type ShelfDefinition = RoomDefinition['platforms'][number];
type ShelfDecoration = Extract<Decoration, { kind: 'rect' }>;

export class Shelf {
  readonly id: string;
  readonly platform: Phaser.GameObjects.Rectangle;
  private wobbleStartedAt: number | null = null;
  private readonly model: ShelfStability;
  private readonly history = new DamageHistory();
  private readonly graphic: Phaser.GameObjects.Container;
  private readonly art: ShelfArt;
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
    this.art = new ShelfArt(scene, b, this.decorations);
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
      (this.platform.body as Phaser.Physics.Arcade.StaticBody).enable = false;
      this.graphic.setAngle(0).setY(this.floorY - this.art.debrisBottom);
    } else
      this.graphic.setAngle(
        state === 'intact' || this.wobbleStartedAt === null
          ? 0
          : shelfWobbleAngle(time - this.wobbleStartedAt, state === 'damaged'),
      );

    return event;
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

  reset() {
    this.model.reset();
    this.wobbleStartedAt = null;
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
