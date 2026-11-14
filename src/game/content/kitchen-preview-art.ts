import type Phaser from 'phaser';
import type { RoomDefinition } from './definitions';

/** Provisional code-native room art, replaced by approved kitchen assets later. */
// eslint-disable-next-line max-lines-per-function -- Wand, Fliesenspiegel und Boden bilden gemeinsam die vorläufige Raumkulisse.
export function drawKitchenPreview(scene: Phaser.Scene, room: RoomDefinition, padding: number) {
  const g = scene.add.graphics();
  const x = -padding;
  const width = room.width + padding * 2;

  g.fillStyle(room.wallColor).fillRect(x, 0, width, room.floor.y);
  g.fillStyle(0xb3bab0).fillRect(x, room.floor.y - 340, width, 340);

  for (let y = room.floor.y - 338; y < room.floor.y; y += 26)
    for (let tileX = x; tileX < room.width + padding; tileX += 64)
      g.fillStyle(0xe0dfcc).fillRect(tileX + 2, y, 60, 24);
  g.fillStyle(0x67665f).fillRect(x, room.floor.y, width, room.height - room.floor.y);

  for (let y = room.floor.y + 2; y < room.height; y += 36)
    for (let tileX = x; tileX < room.width + padding; tileX += 48)
      g.fillStyle(room.floor.color).fillRect(tileX + 2, y, 46, 34);
  g.fillStyle(0x666c65).fillRect(x, 0, width, 12);
  g.fillStyle(0xe0dfcc).fillRect(x, 12, width, 4);
}
