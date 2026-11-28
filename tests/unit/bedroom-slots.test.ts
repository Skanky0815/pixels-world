/* eslint-disable max-lines-per-function -- Belegungsprofile, Seeds und Erweiterbarkeit werden an der echten gemeinsamen Slotpipeline geprüft. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BEDROOM } from '../../game/play/content/rooms/bedroom.ts';
import { OBJECTS } from '../../game/play/content/objects/catalog.ts';
import { DIFFICULTIES } from '../../game/play/content/difficulty.ts';
import { populateSpawnSlots } from '../../game/play/content/spawn-slots.ts';
import { pictureWallVariants } from '../../game/play/content/picture-wall-variants.ts';
import { resolveRoom } from '../../game/play/content/resolve-room.ts';
import type { ObjectCatalog, RoomDefinition } from '../../game/play/content/definitions.ts';

function random(seed: number) {
  let value = seed;

  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;

    return value / 4294967296;
  };
}

test('Schlafzimmer: Regale, Bücher, Pflanze und Bilder werden vollständig und deterministisch aus Slots belegt', () => {
  for (const difficulty of DIFFICULTIES) {
    for (let seed = 1; seed <= 24; seed++) {
      const room = populateSpawnSlots(BEDROOM, OBJECTS, difficulty, random(seed));
      const again = populateSpawnSlots(BEDROOM, OBJECTS, difficulty, random(seed));

      assert.deepEqual(room, again);

      for (const shelf of BEDROOM.platforms.flatMap((platform) =>
        'slots' in platform ? [platform] : [],
      )) {
        const count = room.objects.filter((object) => object.id.startsWith(`${shelf.id}:`)).length;

        assert.equal(count, shelf.slots.count[difficulty], `${shelf.id}/${difficulty}/${seed}`);
      }

      assert.equal(
        room.objects.filter((object) => object.id.startsWith('bedroom-books:')).length,
        1,
      );
      assert.equal(room.wallPlacements?.length, difficulty === 'easy' ? 1 : 2);
      assert.equal(new Set(room.objects.map((object) => object.id)).size, room.objects.length);
      assert.deepEqual(room.goal, BEDROOM.goal);
      const resolved = resolveRoom(room, OBJECTS);

      assert.equal(
        resolved.objects.find((object) => object.kind === 'plant')?.config.appearance,
        'spiderplant',
      );
      assert.equal(resolved.goal.surfaceY, BEDROOM.floor.y);
    }
  }
});

test('Zusätzlich registrierte Schlafzimmerbilder werden automatisch übernommen; DEV-only und andere Räume bleiben ausgeschlossen', () => {
  const picture = OBJECTS['cozy-nook'];
  const catalog: ObjectCatalog = {
    ...OBJECTS,
    'future-picture': {
      ...picture,
      album: { ...picture.album, id: 'picture.future', rooms: ['bedroom'] },
    },
    'dev-picture': {
      ...picture,
      album: { ...picture.album, id: 'picture.dev', rooms: ['bedroom'], previewOnly: true },
    },
    'kitchen-only': {
      ...picture,
      album: { ...picture.album, id: 'picture.kitchen', rooms: ['kitchen'] },
    },
  };
  const variants = pictureWallVariants(catalog, 'bedroom');

  assert.ok(variants['future-picture']);
  assert.equal(variants['dev-picture'], undefined);
  assert.equal(variants['kitchen-only'], undefined);
  const room: RoomDefinition = {
    ...BEDROOM,
    wallSlots: {
      ...BEDROOM.wallSlots,
      variants,
      entries: BEDROOM.wallSlots.entries.map((entry) => ({ ...entry, pool: ['future-picture'] })),
    },
  };
  const generated = populateSpawnSlots(room, catalog, 'normal', random(42));

  assert.equal(generated.objects.filter((object) => object.variant === 'future-picture').length, 2);
  assert.equal(generated.wallPlacements?.length, 2);
});
