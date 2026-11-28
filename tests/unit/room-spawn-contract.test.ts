/* eslint-disable max-lines-per-function -- Raumfamilien, Mutationen und Spawnvergleiche bleiben als vollständige Vertragsfälle zusammen lesbar. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { OBJECTS } from '../../game/play/content/objects/catalog.ts';
import { ROOMS } from '../../game/play/content/rooms/index.ts';
import { ROOM_CHOICES } from '../../game/play/content/rooms/selection.ts';
import { KITCHEN_PREVIEW } from '../../game/play/content/rooms/kitchen-preview.ts';
import { DIFFICULTIES, difficultyRoom } from '../../game/play/content/difficulty.ts';
import { filterSpawnCandidates } from '../../game/play/content/spawn-profile.ts';
import { populateSpawnSlots } from '../../game/play/content/spawn-slots.ts';
import { resolveRoom } from '../../game/play/content/resolve-room.ts';
import {
  PLAYGROUND_BASES,
  spawnPlaygroundObject,
} from '../../game/play/content/playground-layout.ts';
import type { ObjectCatalog, RoomDefinition } from '../../game/play/content/definitions.ts';
import type { WallSlots } from '../../game/play/content/wall-slots.ts';

// Test oracle only: production authorization stays in the authored room pools.
const EXPECTED = {
  bedroom: {
    random: [
      'small-vase',
      'blue-vase',
      'heirloom-vase',
      'mellow-vase',
      'reading-books',
      'upright-books',
      'bedroom-spiderplant',
    ],
    fixed: [
      'folded-laundry',
      'laundry-basket',
      'bedside-lamp',
      'bedroom-runner',
      'short-khaki-curtain',
    ],
    goal: 'rest',
  },
  'living-room': {
    random: [
      'catgrass',
      'small-vase',
      'blue-vase',
      'heirloom-vase',
      'mellow-vase',
      'reading-books',
      'upright-books',
    ],
    fixed: ['cozy-couch', 'worn-couch', 'warm-curtain', 'heirloom-vase', 'living-room-rug'],
    goal: 'toy',
  },
  kitchen: {
    random: [
      'kitchen-basil',
      'kitchen-parsley',
      'kitchen-mint',
      'cream-cup',
      'cream-plate',
      'pasta-jar',
      'biscuit-tin',
      'cream-trash-bin',
      'dry-food-bag',
    ],
    fixed: ['warm-tablecloth'],
    goal: 'food',
  },
} as const;

type Family = keyof typeof EXPECTED;
const FAMILIES = {
  bedroom: 'bedroom',
  'living-room': 'living-room',
  'cozy-remix': 'living-room',
  kitchen: 'kitchen',
  'kitchen-preview': 'kitchen',
} as const satisfies Record<string, Family>;
const PICTURES = ['pixel-portrait', 'berlin-tower', 'cozy-nook'];
const CONTENT_ROOMS: readonly RoomDefinition[] = [...Object.values(ROOMS), KITCHEN_PREVIEW];

function assertVariants(actual: readonly string[], expected: readonly string[], path: string) {
  for (const variant of actual)
    assert.ok(expected.includes(variant), `${path}: unexpected variant ${variant}`);
}

/** Inspect every authored candidate, including zero-density and hard-only slots. */
function assertRoomPools(room: RoomDefinition, family: Family) {
  const expected = EXPECTED[family];

  for (const platform of room.platforms)
    assertVariants(
      platform.slots?.entries.flatMap((slot) => slot.pool) ?? [],
      expected.random,
      `${room.id}.${platform.id}`,
    );

  for (const group of room.objectSlots ?? [])
    assertVariants(
      group.entries.flatMap((slot) => slot.pool),
      expected.random,
      `${room.id}.${group.id}`,
    );

  assertVariants(
    room.objects.map((object) => object.variant),
    expected.fixed,
    `${room.id}.fixed`,
  );
  assert.equal(room.goal.kind, expected.goal, `${room.id}.goal`);
  assert.equal(room.goal.spawn.random, false);
  assert.equal(room.goal.spawn.reason, 'main-goal');
  assertWallPools(room, family);
}

function assertWallPools(room: RoomDefinition, family: Family) {
  if (!room.wallSlots) return;

  for (const slot of room.wallSlots.entries)
    for (const key of slot.pool) {
      const variant: WallSlots['variants'][string] = room.wallSlots.variants[key];

      assert.ok(variant, `${room.id}.${slot.id}: unknown wall template ${key}`);

      if (variant.kind === 'picture') {
        assert.ok(variant.objectVariant, `${room.id}.${key}: missing picture mapping`);
        assertVariants([variant.objectVariant], PICTURES, `${room.id}.${key}`);
      } else assert.equal(family, 'living-room', `${room.id}: unexpected random wall shelf`);
    }
}

test('Alle Raumfamilien prüfen feste Objekte, Ziele und sämtliche Pools je Schwierigkeit', () => {
  assert.deepEqual(CONTENT_ROOMS.map((room) => room.id).sort(), Object.keys(FAMILIES).sort());
  assert.deepEqual(
    ROOM_CHOICES.filter((choice) => choice.definition).map((choice) => choice.id),
    ['living-room', 'kitchen', 'bedroom'],
  );

  for (const room of CONTENT_ROOMS)
    for (const difficulty of DIFFICULTIES) {
      const configured = difficultyRoom(room, difficulty);

      resolveRoom(configured, OBJECTS);
      assertRoomPools(configured, FAMILIES[room.id as keyof typeof FAMILIES]);
    }
});

function withPlantPool(room: RoomDefinition, variant: string): RoomDefinition {
  return {
    ...room,
    objectSlots: [
      {
        id: 'plant-contract',
        count: { easy: 0, normal: 1, hard: 1 },
        entries: [
          {
            id: 'floor-plant',
            surfaceId: 'floor',
            x: 54,
            capacity: 'medium',
            categories: ['plant'],
            pool: [variant],
          },
        ],
      },
    ],
  };
}

test('Geometrisch passende Kräuter im Wohnzimmer und Katzengras in der Küche scheitern am Inhaltsvertrag', () => {
  const candidates = filterSpawnCandidates(OBJECTS, {
    capacity: 'medium',
    categories: ['plant'],
    support: 'floor',
  });

  assert.ok(candidates.includes('catgrass'));
  assert.ok(candidates.includes('kitchen-basil'));

  for (const room of CONTENT_ROOMS) {
    const family = FAMILIES[room.id as keyof typeof FAMILIES];

    if (family === 'bedroom') {
      for (const variant of ['catgrass', 'kitchen-basil'])
        assert.throws(
          () => assertRoomPools(withPlantPool(room, variant), family),
          /unexpected variant/,
        );
      continue;
    }

    const allowed = family === 'kitchen' ? 'kitchen-basil' : 'catgrass';
    const forbidden = family === 'kitchen' ? 'catgrass' : 'kitchen-basil';

    assertRoomPools(withPlantPool(room, allowed), family);
    assert.throws(
      () => assertRoomPools(withPlantPool(room, forbidden), family),
      /unexpected variant/,
    );
  }
});

test('Auch feste Fremdobjekte und vertauschte Wandgrafiken werden zentral erkannt', () => {
  const room = ROOMS['living-room'];

  assert.throws(
    () =>
      assertRoomPools(
        { ...room, objects: [{ ...room.objects[0], variant: 'warm-tablecloth' }] },
        'living-room',
      ),
    /fixed: unexpected variant/,
  );
  assert.throws(
    () =>
      assertRoomPools(
        {
          ...room,
          wallSlots: {
            ...room.wallSlots,
            variants: {
              ...room.wallSlots.variants,
              pixelPortrait: {
                ...room.wallSlots.variants.pixelPortrait,
                objectVariant: 'catgrass',
              },
            },
          },
        },
        'living-room',
      ),
    /pixelPortrait: unexpected variant/,
  );
});

test('Raumfreigabe ersetzt weder Größen-, Auflagen- noch Capabilityfilter', () => {
  const plant = { capacity: 'medium', categories: ['plant'], support: 'raised' } as const;

  assert.ok(filterSpawnCandidates(OBJECTS, plant).includes('kitchen-basil'));
  assert.ok(!filterSpawnCandidates(OBJECTS, plant).includes('catgrass'));
  assert.ok(
    !filterSpawnCandidates(OBJECTS, { ...plant, requiredCapabilities: ['push'] }).includes(
      'kitchen-basil',
    ),
  );
  assert.ok(
    !filterSpawnCandidates(OBJECTS, {
      capacity: 'small',
      categories: ['furniture'],
      support: 'floor',
    }).includes('cream-trash-bin'),
  );
});

const Random = createRequire(import.meta.url)(
  'phaser/src/math/random-data-generator/RandomDataGenerator.js',
) as new (seed: string[]) => { frac(): number };

function seeded(room: RoomDefinition, catalog: ObjectCatalog) {
  const rng = new Random(['room-contract']);
  let calls = 0;
  const populated = populateSpawnSlots(room, catalog, 'normal', () => {
    calls++;

    return rng.frac();
  });

  return { populated, calls };
}

test('Albumkapitel verändern weder Pools, Platzierungen noch RNG-Aufrufe', () => {
  const catalog: ObjectCatalog = Object.fromEntries(
    Object.entries(OBJECTS).map(([key, object]) => [
      key,
      { ...object, album: object.album && { ...object.album, rooms: ['study'] } },
    ]),
  );

  for (const room of CONTENT_ROOMS) assert.deepEqual(seeded(room, catalog), seeded(room, OBJECTS));
});

test('Die Spielwiese erlaubt raumfremde Varianten über dieselbe validierte Spawnfunktion', () => {
  for (const base of ['living-room', 'kitchen-preview'] as const) {
    const layout = { ...PLAYGROUND_BASES[base], objects: [] };
    const variant = base === 'living-room' ? 'kitchen-basil' : 'catgrass';
    const next = spawnPlaygroundObject(layout, {
      id: 'cross-room-plant',
      variant,
      placement: { mode: 'surface', surfaceId: 'floor', x: 54 },
    });

    assert.equal(next.objects[0].variant, variant);
    assert.equal(layout.objects.length, 0);
  }
});
