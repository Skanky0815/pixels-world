import assert from 'node:assert/strict';
import { test } from 'node:test';
import { LIVING_ROOM } from '../../src/content/rooms/living-room.ts';
import { COZY_REMIX } from '../../src/content/rooms/cozy-remix.ts';
import { OBJECTS } from '../../src/content/objects/catalog.ts';
import { resolveRoom } from '../../src/game/content/resolve-room.ts';
import type { ObjectCatalog } from '../../src/game/content/definitions.ts';

test('Beide Wohnzimmer besitzen genau einen echten Teppich an der Bodenlinie', () => {
  for (const room of [LIVING_ROOM, COZY_REMIX]) {
    const rugs = resolveRoom(room, OBJECTS).objects.filter((o) => o.kind === 'carpet');

    assert.equal(rugs.length, 1);
    assert.equal(rugs[0].config.floorY, room.floor.y);
    assert.equal(rugs[0].config.area.y, room.floor.y - 2);
    assert.equal(rugs[0].config.area.width, 430);
    assert.ok(!room.decorations.some((d) => d.kind === 'image' && d.asset === 'room-rug'));
  }
});

// eslint-disable-next-line max-lines-per-function -- Zu kleine Grafiken, unzulässige Auflagen und Zufallspools scheitern vor dem Szenenaufbau.
test('Teppiche brauchen eine geeignete Bodenfläche und gültige Regeln', () => {
  const rug = LIVING_ROOM.objects.find((o) => o.id === 'living-room-rug')!;

  assert.throws(
    () =>
      resolveRoom(
        {
          ...LIVING_ROOM,
          objects: [{ ...rug, placement: { mode: 'surface', x: 502, surfaceId: 'lower-shelf' } }],
        },
        OBJECTS,
      ),
    /floor support/,
  );

  for (const patch of [
    { geometry: { width: 20, height: 30 } },
    { geometry: { width: 430, height: 4 } },
    { rules: { delayMs: 1, retchMs: 0, points: 15 } },
    { spawn: { size: 'large', category: 'furniture', random: true, support: 'floor' } },
  ])
    assert.throws(() =>
      resolveRoom(LIVING_ROOM, {
        ...OBJECTS,
        'living-room-rug': { ...OBJECTS['living-room-rug'], ...patch },
      } as unknown as ObjectCatalog),
    );
});
