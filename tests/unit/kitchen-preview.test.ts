import assert from 'node:assert/strict';
import { test } from 'node:test';
import { KITCHEN_PREVIEW } from '../../src/content/rooms/kitchen-preview.ts';
import { OBJECTS } from '../../src/content/objects/catalog.ts';
import { selectRoom } from '../../src/content/rooms/index.ts';
import { playableRoom } from '../../src/content/rooms/selection.ts';
import { resolveRoom } from '../../src/game/content/resolve-room.ts';
import type { RoomDefinition } from '../../src/game/content/definitions.ts';

test('Unfertige Küchenvorschau bleibt außerhalb der öffentlichen Auswahl und Produktions-URL', () => {
  assert.equal(selectRoom('kitchen-preview', true), KITCHEN_PREVIEW);
  assert.equal(selectRoom('kitchen-preview', false).id, 'living-room');
  assert.equal(playableRoom('kitchen'), undefined);
  assert.equal(playableRoom('kitchen-preview'), undefined);
  assert.equal(resolveRoom(KITCHEN_PREVIEW, OBJECTS).goal.surfaceY, 258);
});

test('Möbelgrafiken dürfen keine unbekannten oder zerbrechlichen Plattformen kaschieren', () => {
  for (const change of [{ appearance: 'unknown' }, { durability: { stability: 'fragile' } }]) {
    const room = {
      ...KITCHEN_PREVIEW,
      platforms: KITCHEN_PREVIEW.platforms.map((p, index) => (index ? p : { ...p, ...change })),
    } as RoomDefinition;

    assert.throws(() => resolveRoom(room, OBJECTS), /platforms.kitchen-stool.appearance/);
  }
});
