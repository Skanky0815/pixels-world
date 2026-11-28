import type Phaser from 'phaser';
import type { Bounds } from '../interactions/contracts';
import type { FurnitureAppearance } from '../content/definitions';

export function isBedroomFurniture(appearance: FurnitureAppearance) {
  return ['bed', 'nightstand', 'wardrobe'].includes(appearance);
}

/** Artwork keeps the approved physical support and floor anchors. */
// eslint-disable-next-line max-lines-per-function -- Bildanker und Ausgabemaße bleiben zusammen an die reale Auflage gebunden.
export function drawBedroomFurniture(
  scene: Phaser.Scene,
  b: Bounds,
  floorY: number,
  appearance: FurnitureAppearance,
) {
  return scene.add
    .image(0, 0, `bedroom-${appearance}`)
    .setOrigin(0)
    .setDisplaySize(b.width, floorY - b.y);
}
