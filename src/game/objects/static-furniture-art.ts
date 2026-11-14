import type Phaser from 'phaser';
import type { Bounds } from '../interactions/contracts';
import type { FurnitureAppearance } from '../content/definitions';
import type { ShelfStability } from '../domain/shelf-stability';

/** The shared stable support anchors the matching exported furniture sprite. */
export class StaticFurnitureArt {
  readonly root: Phaser.GameObjects.Container;
  readonly boardHeight: number;
  readonly debrisBoardHeight: number;
  readonly debrisBottom: number;

  // eslint-disable-next-line max-lines-per-function -- Bildanker, volle Möbelhöhe und Kollisionsstärke stammen gemeinsam aus der Raumgeometrie.
  constructor(scene: Phaser.Scene, b: Bounds, floorY: number, appearance: FurnitureAppearance) {
    this.root = scene.add.container(b.x + b.width / 2, b.y);
    this.boardHeight = b.height;
    this.debrisBoardHeight = b.height;
    this.debrisBottom = floorY - b.y;
    this.root.add(
      scene.add
        .image(0, 0, `kitchen-${appearance}`)
        .setOrigin(0.5, 0)
        .setDisplaySize(b.width, floorY - b.y),
    );
  }

  render(state: ReturnType<ShelfStability['snapshot']>) {
    this.root.setVisible(state.state !== 'collapsed');
  }
}
