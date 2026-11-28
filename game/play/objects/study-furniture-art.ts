import type Phaser from 'phaser';
import type { Bounds } from '../interactions/contracts';
import type { FurnitureAppearance } from '../content/definitions';

export function isStudyFurniture(appearance: FurnitureAppearance) {
  return ['study-desk', 'study-chair', 'study-bookcase', 'study-bookcase-board'].includes(
    appearance,
  );
}

/** Seat, boards and floor retain the approved physical anchors. */

export function drawStudyFurniture(
  scene: Phaser.Scene,
  b: Bounds,
  floorY: number,
  appearance: FurnitureAppearance,
) {
  const offset = appearance === 'study-chair' ? 88 : 0;
  const height = appearance === 'study-bookcase-board' ? b.height : floorY - b.y + offset;

  return scene.add.image(0, -offset, appearance).setOrigin(0).setDisplaySize(b.width, height);
}
