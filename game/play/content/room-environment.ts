import type Phaser from 'phaser';
import type { RoomDefinition } from './definitions';

export function drawRoomEnvironment(scene: Phaser.Scene, room: RoomDefinition, padding = 0) {
  const x = -padding;
  const width = room.width + padding * 2;

  tile(scene, 'room-plaster', x, 0, width, room.floor.y);
  tile(scene, 'room-panel', x, room.floor.y - 128, width, 128);
  tile(scene, 'room-floor', x, room.floor.y, width, room.height - room.floor.y)
    .setTileScale(room.floor.plankWidth / 48, room.floor.plankHeight / 12)
    .setTilePosition(x / (room.floor.plankWidth / 48), 0);
  tile(scene, 'room-ceiling', x, 0, width, 14);
}

// eslint-disable-next-line max-lines-per-function -- Die vollständige Kachelerzeugung hält Texturmaßstab und weltfesten Musterursprung zusammen.
function tile(
  scene: Phaser.Scene,
  key: string,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  return scene.add
    .tileSprite(x, y, width, height, key)
    .setOrigin(0)
    .setTileScale(2)
    .setTilePosition(x / 2, 0);
}
