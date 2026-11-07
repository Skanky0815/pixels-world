import { translateExact, onLanguageChange } from '../../i18n/locale';
import type Phaser from 'phaser';
import type { RoomDefinition } from './definitions';

import { drawRoomEnvironment } from './room-environment';

/** Data-driven art and legacy primitives share the same room and support coordinates. */
export function drawRoom(scene: Phaser.Scene, room: RoomDefinition) {
  if (room.environment === 'cozy-room') drawRoomEnvironment(scene, room);
  else drawLegacyBackground(scene, room);

  for (const decoration of room.decorations) drawDecoration(scene, decoration);
}

// eslint-disable-next-line max-lines-per-function -- Der bisherige Wand-/Bodenrenderer bleibt für Räume ohne Grafikthema vollständig erhalten.
function drawLegacyBackground(scene: Phaser.Scene, room: RoomDefinition) {
  const g = scene.add.graphics();

  g.fillStyle(room.wallColor).fillRect(0, 0, room.width, room.floor.y);
  g.fillStyle(room.floor.color).fillRect(0, room.floor.y, room.width, room.height - room.floor.y);

  for (let y = room.floor.y + 16; y < room.height; y += room.floor.plankHeight)
    g.fillStyle(room.floor.plankColor).fillRect(0, y, room.width, Math.min(2, room.height - y));

  for (let x = 0; x < room.width; x += room.floor.plankWidth)
    g.fillStyle(room.floor.plankColor).fillRect(
      x,
      room.floor.y + 2,
      Math.min(2, room.width - x),
      Math.min(14, room.height - room.floor.y - 2),
    );
}

// eslint-disable-next-line max-lines-per-function -- Bild-, Rechteck- und Textdekoration teilen dieselbe validierte Platzierung und Szenenlebensdauer.
function drawDecoration(scene: Phaser.Scene, decoration: RoomDefinition['decorations'][number]) {
  if (decoration.kind === 'image') {
    const b = decoration.bounds;

    scene.add.image(b.x, b.y, decoration.asset).setOrigin(0).setDisplaySize(b.width, b.height);
  } else if (decoration.kind === 'rect') {
    if (decoration.supportedBy) return;
    const b = decoration.bounds;

    scene.add.graphics().fillStyle(decoration.color).fillRect(b.x, b.y, b.width, b.height);
  } else {
    const text = scene.add.text(decoration.x, decoration.y, translateExact(decoration.text), {
      fontFamily: 'monospace',
      fontSize: `${decoration.size}px`,
      color: `#${decoration.color.toString(16).padStart(6, '0')}`,
    });
    const unsubscribe = onLanguageChange(() => text.setText(translateExact(decoration.text)));

    scene.events.once('shutdown', unsubscribe);
  }
}
