import type Phaser from 'phaser';
import type { Bounds } from '../interactions/contracts';
import type { FurnitureAppearance } from '../content/definitions';
import type { ShelfStability } from '../domain/shelf-stability';

/** DEV blockout: the shared stable support owns both collision and visible top. */
export class StaticFurnitureArt {
  readonly root: Phaser.GameObjects.Container;
  readonly boardHeight: number;
  readonly debrisBoardHeight: number;
  readonly debrisBottom: number;

  // eslint-disable-next-line max-lines-per-function -- Bildanker und vollständige Möbelgeometrie werden aus derselben Auflage erzeugt.
  constructor(scene: Phaser.Scene, b: Bounds, floorY: number, appearance: FurnitureAppearance) {
    this.root = scene.add.container(b.x + b.width / 2, b.y);
    this.boardHeight = b.height;
    this.debrisBoardHeight = b.height;
    this.debrisBottom = floorY - b.y;
    const g = scene.add.graphics();
    const left = -b.width / 2;

    if (appearance === 'counter') counter(g, left, b.width, b.height);
    else legs(g, left, b.width, floorY - b.y, b.height);
    g.fillStyle(0x4c3934).fillRect(left, 0, b.width, 4);
    g.fillStyle(0xa47a56).fillRect(left, 4, b.width, Math.min(b.height - 4, 10));
    g.fillStyle(0xd0aa77).fillRect(left + 2, 4, b.width - 4, 2);
    this.root.add(g);
  }

  render(state: ReturnType<ShelfStability['snapshot']>) {
    this.root.setVisible(state.state !== 'collapsed');
  }
}

// eslint-disable-next-line max-lines-per-function -- Beide Beine und die Querstrebe teilen Maße und Bodenanker.
function legs(
  g: Phaser.GameObjects.Graphics,
  left: number,
  width: number,
  rise: number,
  top: number,
) {
  g.fillStyle(0x483d38);

  for (const x of [left + 8, left + width - 20]) {
    g.fillRect(x, top, 12, rise - top);
    g.fillStyle(0x73614e).fillRect(x + 2, top, 4, rise - top);
    g.fillStyle(0x483d38);
  }

  g.fillRect(left + 12, rise - 20, width - 28, 6);
}

// eslint-disable-next-line max-lines-per-function -- Korpus, Türfronten und Sockel bleiben in einer zusammenhängenden Möbelzeichnung.
function counter(g: Phaser.GameObjects.Graphics, left: number, width: number, height: number) {
  g.fillStyle(0x393b40).fillRect(left, 12, width, height - 12);
  const count = Math.max(1, Math.floor(width / 100));
  const doorWidth = width / count;

  for (let i = 0; i < count; i++) {
    const x = left + i * doorWidth + 6;

    g.fillStyle(0x585b59).fillRect(x, 20, doorWidth - 12, height - 32);
    g.fillStyle(0xb8ac8b).fillRect(x + doorWidth - 26, 32, 4, 22);
  }

  g.fillStyle(0x27282c).fillRect(left + 4, height - 10, width - 8, 10);
}
