import type Phaser from 'phaser';
import type { RoomDefinition } from './definitions';

/** Kitchen modules repeat independently of room width and camera padding. */
// eslint-disable-next-line max-lines-per-function -- Putz, Boden und Deckenabschluss teilen Raumgrenzen und weltfeste Kachelursprünge.
export function drawKitchenPreview(scene: Phaser.Scene, room: RoomDefinition, padding: number) {
  const x = -padding;
  const width = room.width + padding * 2;

  scene.add
    .tileSprite(x, 0, width, room.floor.y, 'kitchen-plaster')
    .setOrigin(0)
    .setTileScale(2)
    .setTilePosition(x / 2, 0);
  scene.add
    .tileSprite(x, room.floor.y, width, room.height - room.floor.y, 'kitchen-floor-tiles')
    .setOrigin(0)
    .setTilePosition(x, 0);
  scene.add
    .tileSprite(x, 0, width, 14, 'room-ceiling')
    .setOrigin(0)
    .setTileScale(2)
    .setTilePosition(x / 2, 0);
  drawBacksplash(scene, room);
}

// eslint-disable-next-line max-lines-per-function -- Fliesen schließen direkt an die tatsächlichen Ober- und Unterschrankgrenzen an.
function drawBacksplash(scene: Phaser.Scene, room: RoomDefinition) {
  const counter = room.platforms.find((p) => p.appearance === 'counter')?.bounds;
  const cabinet = room.decorations.find(
    (d) => d.kind === 'image' && d.asset === 'kitchen-wall-cabinet',
  );

  if (!counter) return;
  const top =
    cabinet?.kind === 'image'
      ? cabinet.bounds.y + cabinet.bounds.height
      : Math.max(0, counter.y - 128);

  if (top >= counter.y) return;
  scene.add
    .tileSprite(counter.x, top, counter.width, counter.y - top, 'kitchen-wall-tiles')
    .setOrigin(0);
  scene.add
    .graphics()
    .lineStyle(2, 0x9b8464)
    .strokeRect(counter.x, top, counter.width, counter.y - top);
}
