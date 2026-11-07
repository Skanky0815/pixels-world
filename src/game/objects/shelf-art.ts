import type Phaser from 'phaser';
import type { Bounds } from '../interactions/contracts';
import type { Decoration } from '../content/definitions';
import type { ShelfStability } from '../domain/shelf-stability';

type State = ReturnType<ShelfStability['snapshot']>;
type ShelfDecoration = Extract<Decoration, { kind: 'rect' }>;

/** End caps stay fixed; the middle repeats at 2× for every configured width. */
export class ShelfArt {
  readonly root: Phaser.GameObjects.Container;
  readonly boardHeight: number;
  readonly debrisBoardHeight: number;
  readonly debrisBottom: number;
  private readonly intact: Phaser.GameObjects.Container;
  private readonly debris: Phaser.GameObjects.Container;
  private readonly marks: Phaser.GameObjects.Graphics;
  private state = '';

  // eslint-disable-next-line max-lines-per-function -- Tragezustand, Bruchstücke und Markierungen teilen sich einen einzigen Transformationsanker.
  constructor(
    scene: Phaser.Scene,
    private readonly bounds: Bounds,
    decorations: readonly ShelfDecoration[],
  ) {
    this.root = scene.add.container(bounds.x + bounds.width / 2, bounds.y);
    this.intact = createBoard(scene, bounds, decorations);
    this.debris = createDebris(scene, bounds, decorations).setVisible(false);
    this.boardHeight = (this.intact.list[1] as Phaser.GameObjects.TileSprite).displayHeight;
    this.debrisBoardHeight = (
      (this.debris.list[0] as Phaser.GameObjects.Container).list[0] as Phaser.GameObjects.TileSprite
    ).displayHeight;
    this.debrisBottom = this.debris.getBounds().bottom;
    this.marks = scene.add.graphics();
    this.root.add([this.intact, this.debris, this.marks]);
  }

  // eslint-disable-next-line max-lines-per-function -- Dieselben Sprites wechseln gemeinsam zwischen tragendem Brett und Bruchstücken; Riss und Stabilitätsmarke liegen separat darüber.
  render(state: State) {
    if (this.state === state.state) return;
    this.state = state.state;
    this.intact.setVisible(state.state !== 'collapsed');
    this.debris.setVisible(state.state === 'collapsed');
    this.marks.clear();

    if (state.state === 'collapsed') return;

    if (state.stability !== 'stable')
      this.marks
        .fillStyle(state.stability === 'fragile' ? 0xa5654e : 0x718463)
        .fillRect(-this.bounds.width / 2 + 4, 5, 6, state.stability === 'fragile' ? 3 : 7);

    if (state.state === 'damaged')
      this.marks
        .lineStyle(2, 0x40332e)
        .lineBetween(-4, 3, 1, 8)
        .lineBetween(1, 8, -2, this.bounds.height);
  }
}

// eslint-disable-next-line max-lines-per-function -- Endstücke, wiederholte Mitte, zwei Träger und zugeordnete Bücher bilden ein einziges unveränderliches Regalbild.
function createBoard(scene: Phaser.Scene, b: Bounds, decorations: readonly ShelfDecoration[]) {
  const left = -b.width / 2;
  const board = scene.add.container();

  board.add([
    scene.add.image(left, 0, 'shelf-left').setOrigin(0).setDisplaySize(16, b.height),
    scene.add
      .tileSprite(left + 16, 0, b.width - 32, b.height, 'shelf-center')
      .setOrigin(0)
      .setTileScale(2, b.height / 8),
    scene.add
      .image(-left - 16, 0, 'shelf-right')
      .setOrigin(0)
      .setDisplaySize(16, b.height),
    scene.add
      .image(left + 12, b.height, 'shelf-bracket')
      .setOrigin(0)
      .setScale(2),
    scene.add
      .image(-left - 20, b.height, 'shelf-bracket')
      .setOrigin(0)
      .setScale(2),
  ]);
  const books = scene.add.graphics();

  for (const d of decorations)
    books
      .fillStyle(d.color)
      .fillRect(d.bounds.x - b.x + left, d.bounds.y - b.y, d.bounds.width, d.bounds.height);
  board.add(books);

  return board;
}

// eslint-disable-next-line max-lines-per-function -- Bruchstücke verwenden dieselben Brett- und Trägertexturen, ohne eine neue Animation oder Kollisionsfläche anzulegen.
function createDebris(scene: Phaser.Scene, b: Bounds, decorations: readonly ShelfDecoration[]) {
  const width = b.width;
  const debris = scene.add.container();

  const leftWidth = Math.round(width * 0.45),
    rightWidth = Math.round(width * 0.4);

  debris.add([
    brokenBoard(scene, leftWidth, b.height)
      .setPosition(-width / 2, -4)
      .setAngle(-4),
    brokenBoard(scene, rightWidth, b.height)
      .setPosition(4 + rightWidth, 0)
      .setScale(-1, 1)
      .setAngle(6),
    scene.add
      .image(-width / 4, 0, 'shelf-bracket')
      .setScale(2)
      .setAngle(80),
    scene.add
      .image(-6, b.height - 2, 'shelf-break')
      .setOrigin(0.5, 1)
      .setDisplaySize(5, 3),
    scene.add
      .image(1, b.height - 1, 'shelf-break')
      .setOrigin(0.5, 1)
      .setDisplaySize(4, 3),
  ]);
  const books = scene.add.graphics();

  for (let i = 0; i < decorations.length; i++)
    books.fillStyle(decorations[i].color).fillRect(-width / 3 + i * 14, -6 - i * 2, 22, 4);
  debris.add(books);

  return debris;
}

// eslint-disable-next-line max-lines-per-function -- Der wiederholte Holzkörper endet in einer eigenen transparent ausgefransten Bruchkante mit unveränderter Brettstärke.
function brokenBoard(scene: Phaser.Scene, width: number, height: number) {
  const board = scene.add.container();
  const edgeWidth = Math.min(16, width / 2);

  board.add([
    scene.add
      .tileSprite(0, 0, width - edgeWidth, height, 'shelf-center')
      .setOrigin(0)
      .setTileScale(2, height / 8),
    scene.add
      .image(width - edgeWidth, 0, 'shelf-break')
      .setOrigin(0)
      .setDisplaySize(edgeWidth, height),
  ]);

  return board;
}
