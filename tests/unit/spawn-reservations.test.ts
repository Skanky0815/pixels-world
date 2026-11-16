import assert from 'node:assert/strict';
import { test } from 'node:test';
import { LIVING_ROOM } from '../../game/play/content/rooms/living-room.ts';
import { KITCHEN } from '../../game/play/content/rooms/kitchen.ts';
import { OBJECTS } from '../../game/play/content/objects/catalog.ts';
import { populateSpawnSlots } from '../../game/play/content/spawn-slots.ts';
import { resolveRoom } from '../../game/play/content/resolve-room.ts';
import type {
  ObjectCatalog,
  ObjectInstance,
  RoomDefinition,
} from '../../game/play/content/definitions.ts';

type Slot = NonNullable<RoomDefinition['objectSlots']>[number]['entries'][number];
const count = { easy: 1, normal: 1, hard: 1 };
const group = (id: string, entry: Slot) => ({ id, count, entries: [entry] });
const vase = (x: number, surfaceId = 'floor'): Slot => ({
  id: 'vase',
  x: surfaceId === 'floor' ? x : x - 350,
  surfaceId,
  capacity: 'small',
  categories: ['decoration'],
  pool: ['small-vase'],
});
const fixed = (variant: string, x = 500, surfaceId = 'floor'): ObjectInstance => ({
  id: 'fixed',
  variant,
  placement: { mode: 'surface', x, surfaceId },
});
const shelf = {
  id: 'ledge',
  asset: 'wood-shelf',
  bounds: { x: 350, y: 250, width: 300, height: 4 },
} as const;

// eslint-disable-next-line max-lines-per-function -- Der vollständige Raum ohne weitere Zufallsgruppen isoliert den untersuchten Platzierungsvertrag.
function room(
  objects: ObjectInstance[] = [],
  objectSlots: RoomDefinition['objectSlots'] = [],
): RoomDefinition {
  return {
    ...LIVING_ROOM,
    objects,
    objectSlots,
    platforms: [],
    decorations: [],
    navigationClearances: [],
    wallSlots: undefined,
    difficultyObjects: undefined,
    goal: { ...LIVING_ROOM.goal, surfaceId: 'floor', x: 850 },
  };
}

const populate = (source: RoomDefinition, catalog: ObjectCatalog = OBJECTS) =>
  populateSpawnSlots(source, catalog, 'normal', () => 0);

// eslint-disable-next-line max-lines-per-function -- Beide Herkunftswege verwenden denselben physischen Anker und denselben Nachbarplatz.
function sourceRoom(variant: keyof typeof OBJECTS, generated: boolean, neighbor: number) {
  const definition = OBJECTS[variant];
  const slots = [group('neighbor', vase(neighbor))];

  if (generated)
    slots.unshift(
      group('source', {
        id: 'object',
        x: 500,
        surfaceId: 'floor',
        capacity: 'medium',
        categories: [definition.spawn.category],
        pool: [variant],
      }),
    );

  return room(generated ? [] : [fixed(variant)], slots);
}

for (const [variant, width] of [
  ['cream-trash-bin', 48],
  ['cream-cup', 24],
  ['cream-plate', 32],
  ['pasta-jar', 28],
  ['biscuit-tin', 32],
] as const)
  for (const generated of [false, true])
    test(`${variant}: ${generated ? 'Slotobjekt' : 'Festobjekt'} reserviert seine volle Breite`, () => {
      const touching = 500 + width / 2 + 9;
      const overlap = populate(sourceRoom(variant, generated, touching - 1));
      const free = populate(sourceRoom(variant, generated, touching));

      assert.ok(overlap.objects.some((o) => o.variant === variant));
      assert.ok(!overlap.objects.some((o) => o.id === 'neighbor:vase'));
      assert.ok(free.objects.some((o) => o.id === 'neighbor:vase'));
      assert.doesNotThrow(() => resolveRoom(free, OBJECTS));
    });

test('Teller reserviert nur seine tatsächliche Höhe unter einem freien Regalplatz', () => {
  const source = room([fixed('cream-plate')], [group('above', vase(500, 'ledge'))]);
  const result = populate({
    ...source,
    platforms: [{ ...shelf, bounds: { ...shelf.bounds, y: 450 } }],
  });

  assert.ok(result.objects.some((o) => o.id === 'above:vase'));
});

test('Feste Pflanze reserviert ihre Regalauflage statt des Raumbodens', () => {
  const source = room(
    [fixed('kitchen-basil', 500, 'ledge')],
    [group('same-height', vase(520, 'ledge')), group('below', vase(500))],
  );
  const result = populate({ ...source, platforms: [shelf] });

  assert.ok(!result.objects.some((o) => o.id === 'same-height:vase'));
  assert.ok(result.objects.some((o) => o.id === 'below:vase'));
});

// eslint-disable-next-line max-lines-per-function -- Beide Sofaseiten behalten ihren asymmetrischen Grafiküberhang und denselben Sitzanker bei fester und zufälliger Platzierung.
test('Sofa schützt Armlehnen links und rechts mit identischem Slot- und Festanker', () => {
  const definition = OBJECTS['cozy-couch'];
  const catalog: ObjectCatalog = {
    ...OBJECTS,
    'cozy-couch': {
      ...definition,
      spawn: { size: 'large', category: 'furniture', random: true, support: 'floor' },
    },
  };

  for (const generated of [false, true])
    for (const [x, available] of [
      [383, true],
      [384, false],
      [672, false],
      [673, true],
    ] as const) {
      const groups = [group('neighbor', vase(x))];

      if (generated)
        groups.unshift(
          group('couch', {
            id: 'seat',
            x: 527,
            surfaceId: 'floor',
            capacity: 'large',
            categories: ['furniture'],
            pool: ['cozy-couch'],
          }),
        );
      const result = populate(room(generated ? [] : [fixed('cozy-couch', 400)], groups), catalog);

      assert.equal(
        result.objects.some((o) => o.id === 'neighbor:vase'),
        available,
      );
      assert.equal(result.objects.find((o) => o.variant === 'cozy-couch')?.placement.x, 400);
    }
});

test('Teppich und Tischdecke lassen absichtlich überlagerbare Objektplätze frei', () => {
  const source = room(
    [fixed('living-room-rug', 250), { ...fixed('warm-tablecloth', 500, 'ledge'), id: 'cloth' }],
    [group('raised', vase(500, 'ledge')), group('floor-slot', vase(500))],
  );
  const result = populate({ ...source, platforms: [shelf] });

  assert.ok(result.objects.some((o) => o.id === 'raised:vase'));
  assert.ok(result.objects.some((o) => o.id === 'floor-slot:vase'));
});

// eslint-disable-next-line max-lines-per-function -- Derselbe Mülleimerpool wird gegen Auflage, Kapazität, Rand und belegte freie Fläche geprüft.
test('Mülleimer braucht einen mittelgroßen freien Bodenplatz mit ausreichend Randabstand', () => {
  const bin: Slot = {
    id: 'bin',
    x: 500,
    surfaceId: 'floor',
    capacity: 'medium',
    categories: ['furniture'],
    pool: ['cream-trash-bin'],
  };

  for (const [entry, objects, available] of [
    [bin, [], true],
    [{ ...bin, capacity: 'small' }, [], false],
    [{ ...bin, surfaceId: 'ledge', x: 150 }, [], false],
    [{ ...bin, x: 20 }, [], false],
    [bin, [fixed('small-vase')], false],
  ] as const) {
    const result = populate({ ...room([...objects], [group('bins', entry)]), platforms: [shelf] });

    assert.equal(
      result.objects.some((o) => o.variant === 'cream-trash-bin'),
      available,
    );
  }
});

// eslint-disable-next-line max-lines-per-function -- Die öffentlichen Küchenplätze und alle Schwierigkeitsgrade sichern Mülleimer, Beutel, Geschirr und Vorräte mit ihren tatsächlichen Auflagen ab.
test('Öffentliche Küche bietet Mülleimer und Beutel eigene passende Spawnplätze', () => {
  for (const difficulty of ['easy', 'normal', 'hard'] as const) {
    const result = populateSpawnSlots(KITCHEN, OBJECTS, difficulty, () => 0);
    const bin = result.objects.find((o) => o.id === 'kitchen-floor-content:bin');
    const bag = result.objects.find((o) => o.id === 'kitchen-floor-content:food-bag');

    assert.deepEqual(bin, {
      id: 'kitchen-floor-content:bin',
      variant: 'cream-trash-bin',
      placement: { mode: 'surface', x: 560, surfaceId: 'floor' },
    });
    assert.deepEqual(bag, {
      id: 'kitchen-floor-content:food-bag',
      variant: 'dry-food-bag',
      placement: { mode: 'surface', x: 430, surfaceId: 'floor' },
    });
    assert.ok(result.objects.some((o) => ['cream-cup', 'cream-plate'].includes(o.variant)));
    assert.ok(result.objects.some((o) => ['pasta-jar', 'biscuit-tin'].includes(o.variant)));
    assert.doesNotThrow(() => resolveRoom(result, OBJECTS));
  }
});
