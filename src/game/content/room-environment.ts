import type Phaser from 'phaser';
import type { RoomDefinition } from './definitions';

export function drawRoomEnvironment(scene: Phaser.Scene, room: RoomDefinition) {
  tile(scene, 'room-plaster', 0, 0, room.width, room.floor.y);
  tile(scene, 'room-panel', 0, room.floor.y - 128, room.width, 128);
  tile(scene, 'room-floor', 0, room.floor.y, room.width, room.height - room.floor.y).setTileScale(
    room.floor.plankWidth / 48,
    room.floor.plankHeight / 12,
  );
  tile(scene, 'room-ceiling', 0, 0, room.width, 14);
}

function tile(
  scene: Phaser.Scene,
  key: string,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  return scene.add.tileSprite(x, y, width, height, key).setOrigin(0).setTileScale(2);
}
