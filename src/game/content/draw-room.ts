import type Phaser from 'phaser';
import type { RoomDefinition } from './definitions';
import { ASSETS } from '../assets/definitions';

/** Rendering primitives only; all layout, palette and placement comes from content. */
export function drawRoom(scene: Phaser.Scene, room: RoomDefinition) {
  const g = scene.add.graphics();
  const rect = (x: number, y: number, w: number, h: number, color: number) => g.fillStyle(color).fillRect(x, y, w, h);
  rect(0, 0, room.width, room.floor.y, room.wallColor);
  rect(0, room.floor.y, room.width, room.height - room.floor.y, room.floor.color);
  for (let y = room.floor.y + 16; y < room.height; y += room.floor.plankHeight) rect(0, y, room.width, Math.min(2, room.height - y), room.floor.plankColor);
  for (let x = 0; x < room.width; x += room.floor.plankWidth) rect(x, room.floor.y + 2, Math.min(2, room.width - x), Math.min(14, room.height - room.floor.y - 2), room.floor.plankColor);
  for (const decoration of room.decorations) {
    if (decoration.kind === 'rect') {
      const b = decoration.bounds; rect(b.x, b.y, b.width, b.height, decoration.color);
    } else scene.add.text(decoration.x, decoration.y, decoration.text, { fontFamily: 'monospace', fontSize: `${decoration.size}px`, color: `#${decoration.color.toString(16).padStart(6, '0')}` });
  }
  for (const platform of room.platforms) {
    const { x, y, width: w, height: h } = platform.bounds;
    const asset = ASSETS[platform.asset];
    rect(x, y, w, h, asset.color); rect(x, y, w, 4, asset.edgeColor);
    rect(x + 12, y + h, 8, 20, asset.bracketColor); rect(x + w - 20, y + h, 8, 20, asset.bracketColor);
  }
}
