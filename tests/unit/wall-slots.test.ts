import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { LIVING_ROOM } from '../../src/content/rooms/living-room.ts';
import { COZY_REMIX } from '../../src/content/rooms/cozy-remix.ts';
import { OBJECTS } from '../../src/content/objects/catalog.ts';
import { difficultyRoom } from '../../src/content/difficulty.ts';
import { populateSpawnSlots } from '../../src/game/content/spawn-slots.ts';
import { resolveRoom } from '../../src/game/content/resolve-room.ts';
import type { ObjectCatalog, RoomDefinition } from '../../src/game/content/definitions.ts';

const Random = createRequire(import.meta.url)(
  'phaser/src/math/random-data-generator/RandomDataGenerator.js',
) as new (seeds: string[]) => { frac(): number };

// eslint-disable-next-line max-lines-per-function -- Der Helfer verbindet den echten Phaser-RNG mit der gesamten Content-Pipeline.
function populate(
  room: RoomDefinition,
  difficulty: 'easy' | 'normal' | 'hard' = 'normal',
  seed = 'wall',
  catalog: ObjectCatalog = OBJECTS,
) {
  const rng = new Random([seed]);

  return populateSpawnSlots(difficultyRoom(room, difficulty), catalog, difficulty, () =>
    rng.frac(),
  );
}

// eslint-disable-next-line max-lines-per-function -- Bild und Regal werden gegen ihre unterschiedlichen Laufzeitdefinitionen geprüft.
function assertMaterialized(
  room: RoomDefinition,
  placement: NonNullable<RoomDefinition['wallPlacements']>[number],
) {
  if (placement.kind === 'shelf')
    assert.ok(room.platforms.some((p) => p.id === placement.id && p.bounds === placement.bounds));
  else {
    const object = resolveRoom(room, OBJECTS).objects.find((o) => o.id === placement.id);

    assert.equal(object?.kind, 'picture');

    if (object?.kind === 'picture') assert.deepEqual(object.config.area, placement.bounds);
  }
}

// eslint-disable-next-line max-lines-per-function -- Viele echte Seeds prüfen beide Räume und alle Schwierigkeiten als zusammenhängenden Layoutvertrag.
test('Wandbelegung variiert reproduzierbar, respektiert Anker und materialisiert Bilder und echte Regale', () => {
  const kinds = new Set<string>();
  const layouts = new Set<string>();

  for (const room of [LIVING_ROOM, COZY_REMIX]) {
    const before = JSON.stringify(room);

    for (const difficulty of ['easy', 'normal', 'hard'] as const) {
      for (let i = 0; i < 60; i++) {
        const result = populate(room, difficulty, `wall-${i}`);
        const placements = result.wallPlacements ?? [];

        assert.equal(placements.length, difficulty === 'hard' ? 2 : 1);
        assert.deepEqual(result, populate(room, difficulty, `wall-${i}`));
        assert.deepEqual(
          result.platforms.slice(0, room.platforms.length).map((p) => [p.id, p.bounds]),
          room.platforms.map((p) => [p.id, p.bounds]),
        );
        assert.deepEqual(result.goal, room.goal);
        assert.doesNotThrow(() => resolveRoom(result, OBJECTS));
        layouts.add(JSON.stringify(placements));

        placements.forEach((placement) => {
          kinds.add(placement.kind);
          assertMaterialized(result, placement);
        });
      }
    }

    assert.equal(JSON.stringify(room), before);
  }

  assert.deepEqual([...kinds].sort(), ['picture', 'shelf']);
  assert.ok(layouts.size > 4);
});

// eslint-disable-next-line max-lines-per-function -- Eine vollständige Slotfixture hält ihre Daten gemeinsam lesbar.
function singleSlot(
  bounds: { x: number; y: number; width: number; height: number },
  kind: 'picture' | 'shelf' = 'shelf',
): RoomDefinition {
  return {
    ...LIVING_ROOM,
    wallSlots: {
      ...LIVING_ROOM.wallSlots,
      count: { easy: 1, normal: 1, hard: 1 },
      entries: [
        {
          id: 'wall:test',
          bounds,
          capacity: 'large',
          categories: [kind],
          pool: [kind === 'picture' ? 'pixelPortrait' : 'spareShelf'],
        },
      ],
    },
  };
}

// eslint-disable-next-line max-lines-per-function -- Jede Fläche repräsentiert eine andere tatsächlich geschützte Raumstruktur.
test('Wandobjekte verdrängen weder Fenster, Tür, Spawn, Möbel, Ziel noch Sprungkorridor', () => {
  const protectedAreas = [
    { x: 682, y: 126, width: 112, height: 184 },
    { x: 848, y: 252, width: 112, height: 216 },
    { x: 70, y: 410, width: 100, height: 58 },
    { x: 220, y: 330, width: 110, height: 80 },
    { x: 810, y: 110, width: 130, height: 60 },
    { x: 450, y: 210, width: 100, height: 60 },
  ];

  for (const bounds of protectedAreas)
    assert.equal(populate(singleSlot(bounds)).wallPlacements?.length, 0);
  assert.equal(
    populate(singleSlot({ x: 20, y: 170, width: 60, height: 80 }, 'picture')).wallPlacements
      ?.length,
    0,
  );
});

// eslint-disable-next-line max-lines-per-function -- Fehler werden auch bei Dichte null vor der Auswahl erkannt.
test('Ungültige Wanddaten und IDs werden auch in unbesetzten Slots abgewiesen', () => {
  const slots = { ...LIVING_ROOM.wallSlots, count: { easy: 0, normal: 0, hard: 0 } };
  const entry = slots.entries[0];
  const bad = [
    { ...slots, count: { easy: 0, normal: -1, hard: 0 } },
    { ...slots, entries: [{ ...entry, id: 'lower-shelf' }] },
    { ...slots, entries: [{ ...entry, id: 'book-floor:floor-1' }] },
    { ...slots, entries: [{ ...entry, pool: ['missing'] }] },
    { ...slots, entries: [{ ...entry, capacity: 'huge' }] },
    { ...slots, entries: [{ ...entry, bounds: { ...entry.bounds, x: NaN } }] },
    {
      ...slots,
      variants: {
        broken: {
          kind: 'shelf',
          asset: 'wood-shelf',
          width: 80,
          height: 16,
          durability: { stability: 'magic' },
        },
      },
    },
  ];

  for (const wallSlots of bad)
    assert.throws(() => populate({ ...LIVING_ROOM, wallSlots } as unknown as RoomDefinition));
});

const randomCouch = {
  ...OBJECTS['cozy-couch'],
  spawn: { size: 'large', category: 'furniture', random: true, support: 'floor' },
} as const;

// eslint-disable-next-line max-lines-per-function -- Die Raumfixture isoliert optionale große Bodenmöbel mit einer expliziten Vorlage.
function floorRoom(x: number): RoomDefinition {
  return {
    ...LIVING_ROOM,
    navigationClearances: [],
    wallSlots: undefined,
    objects: LIVING_ROOM.objects.filter((o) => o.id !== 'couch'),
    objectSlots: [
      {
        id: 'guest',
        count: { easy: 1, normal: 1, hard: 1 },
        entries: [
          {
            id: 'sofa',
            x,
            surfaceId: 'floor',
            capacity: 'large',
            categories: ['furniture'],
            pool: ['guest-couch'],
          },
        ],
      },
    ],
  };
}

// eslint-disable-next-line max-lines-per-function -- Große Möbel müssen mit ihrer vollständigen sichtbaren Fläche passen, ohne Spawn oder feste Einrichtungen zu verdrängen.
test('Bodenslots unterstützen große Möbel mit korrektem Sitzanker und vollständiger Grafikgröße', () => {
  const catalog = { ...OBJECTS, 'guest-couch': randomCouch };
  const result = populate(floorRoom(300), 'normal', 'floor', catalog);
  const couch = resolveRoom(result, catalog).objects.find((o) => o.id === 'guest:sofa');

  assert.equal(couch?.kind, 'couch');

  if (couch?.kind !== 'couch') throw new Error('missing couch');
  assert.equal(couch.config.seat.x, 173);
  assert.equal(couch.config.seat.y, 370);

  for (const x of [120, 130, 600, 890])
    assert.ok(
      !populate(floorRoom(x), 'normal', 'floor', catalog).objects.some(
        (o) => o.id === 'guest:sofa',
      ),
    );
  const protectedRoom = {
    ...floorRoom(300),
    navigationClearances: [{ x: 180, y: 310, width: 260, height: 158 }],
  };

  assert.ok(
    !populate(protectedRoom, 'normal', 'floor', catalog).objects.some((o) => o.id === 'guest:sofa'),
  );
});

// eslint-disable-next-line max-lines-per-function -- Jeder Schwierigkeitsgrad beider Räume muss genau einen erreichbaren Bodenanker wählen; mehrere Seeds müssen die Lage verändern.
test('Katzengras wird statt fester Instanzen aus freien Boden-Slots gewählt', () => {
  for (const room of [LIVING_ROOM, COZY_REMIX]) {
    const positions = new Set<number>();

    assert.ok(!room.objects.some((o) => String(o.variant) === 'catgrass'));

    for (const difficulty of ['easy', 'normal', 'hard'] as const) {
      for (let i = 0; i < 30; i++) {
        const result = populate(room, difficulty, `grass-${i}`);
        const plants = result.objects.filter((o) => o.variant === 'catgrass');

        assert.equal(plants.length, 1);
        assert.ok(plants[0].id.startsWith('floor-plants:'));
        assert.equal(plants[0].placement.mode, 'surface');
        assert.equal('surfaceId' in plants[0].placement && plants[0].placement.surfaceId, 'floor');
        positions.add(plants[0].placement.x);
      }
    }

    assert.ok(positions.has(54) && positions.has(62));

    if (room.id === 'living-room') assert.ok(positions.has(680));
    else assert.ok(!positions.has(680));
  }
});
