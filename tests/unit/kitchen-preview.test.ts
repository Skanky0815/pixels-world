import assert from 'node:assert/strict';
import { test } from 'node:test';
import { KITCHEN_PREVIEW } from '../../game/play/content/rooms/kitchen-preview.ts';
import { OBJECTS } from '../../game/play/content/objects/catalog.ts';
import { selectRoom } from '../../game/play/content/rooms/index.ts';
import { playableRoom } from '../../game/play/content/rooms/selection.ts';
import { resolveRoom } from '../../game/play/content/resolve-room.ts';
import type { RoomDefinition } from '../../game/play/content/definitions.ts';

test('Küche ist öffentlich auswählbar; die separate DEV-Vorschau bleibt in Produktion isoliert', () => {
  assert.equal(selectRoom('kitchen-preview', true), KITCHEN_PREVIEW);
  assert.equal(selectRoom('kitchen-preview', false).id, 'living-room');
  assert.equal(playableRoom('kitchen')?.id, 'kitchen');
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
