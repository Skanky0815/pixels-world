import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { LIVING_ROOM } from '../../src/content/rooms/living-room.ts';
import { COZY_REMIX } from '../../src/content/rooms/cozy-remix.ts';
import { OBJECTS } from '../../src/content/objects/catalog.ts';
import { difficultyRoom } from '../../src/content/difficulty.ts';
import { populateSpawnSlots } from '../../src/game/content/spawn-slots.ts';
import type { RoomDefinition } from '../../src/game/content/definitions.ts';

const Random = createRequire(import.meta.url)(
  'phaser/src/math/random-data-generator/RandomDataGenerator.js',
) as new (seed: string[]) => { frac(): number };

function populate(
  room: RoomDefinition = LIVING_ROOM,
  difficulty: 'easy' | 'normal' | 'hard' = 'normal',
  seed = 'slots',
) {
  const rng = new Random([seed]);

  return populateSpawnSlots(difficultyRoom(room, difficulty), OBJECTS, difficulty, () =>
    rng.frac(),
  );
}

const spawned = (room: RoomDefinition) =>
  room.objects.filter((o) => o.id.startsWith('lower-shelf:'));

// eslint-disable-next-line max-lines-per-function -- Zusammengehörige Validierung, Platzierung oder Testschritte bleiben als atomarer Ablauf lesbar.
function withSlots(
  entries: NonNullable<RoomDefinition['platforms'][number]['slots']>['entries'],
): RoomDefinition {
  return {
    ...LIVING_ROOM,
    platforms: LIVING_ROOM.platforms.map((p) =>
      p.id === 'lower-shelf'
        ? { ...p, slots: { count: { easy: 1, normal: 2, hard: 3 }, entries } }
        : p,
    ),
  };
}

// eslint-disable-next-line max-lines-per-function -- Zusammengehörige Validierung, Platzierung oder Testschritte bleiben als atomarer Ablauf lesbar.
test('Beide Räume belegen genau 1/2/3 Slots und verändern weder Quelldaten noch feste Ziele', () => {
  for (const room of [LIVING_ROOM, COZY_REMIX]) {
    const before = JSON.stringify(room);

    for (const difficulty of ['easy', 'normal', 'hard'] as const) {
      const result = populate(room, difficulty);

      assert.equal(spawned(result).length, { easy: 1, normal: 2, hard: 3 }[difficulty]);
      assert.deepEqual(result.goal, room.goal);
      assert.ok(
        room.objects.every(
          (o) => result.objects.some((r) => r.id === o.id) || difficulty === 'easy',
        ),
      );
    }

    assert.equal(JSON.stringify(room), before);
  }
});

test('Phasers Seed reproduziert Positionen und Varianten; verschiedene Seeds variieren sie', () => {
  assert.deepEqual(populate(), populate());
  const variants = new Set(
    Array.from({ length: 20 }, (_, i) =>
      JSON.stringify(spawned(populate(LIVING_ROOM, 'normal', String(i)))),
    ),
  );

  assert.ok(variants.size > 5);
});

// eslint-disable-next-line max-lines-per-function -- Zusammengehörige Validierung, Platzierung oder Testschritte bleiben als atomarer Ablauf lesbar.
test('Leere Pools, Kategorien und fehlende Fähigkeiten bleiben leer; feste Objekte werden ausgeschlossen', () => {
  const entries = LIVING_ROOM.platforms[0].slots.entries;
  const incompatible = entries.map((s, i) => ({
    ...s,
    pool: i === 0 ? [] : ['catgrass', 'cozy-couch', 'warm-curtain'],
  }));

  assert.equal(spawned(populate(withSlots(incompatible), 'hard')).length, 0);
  assert.equal(
    spawned(populate(withSlots(entries.map((s) => ({ ...s, categories: [] }))), 'hard')).length,
    0,
  );
  assert.equal(
    spawned(
      populate(withSlots(entries.map((s) => ({ ...s, requiredCapabilities: ['climb'] }))), 'hard'),
    ).length,
    0,
  );
});

// eslint-disable-next-line max-lines-per-function -- Zusammengehöriger Asset-Aufbau bzw. vollständiger Geometrie- und Szenariotest bleibt als ein Ablauf lesbar.
test('Exakte Geometrie verhindert Überlappungen mit Büchern, festen Objekten und anderen Slots', () => {
  const entries = LIVING_ROOM.platforms[0].slots.entries;
  const blocked = entries.map((s, i) => ({ ...s, x: [25, 104, 104][i] }));
  const withBooks = {
    ...withSlots(blocked),
    decorations: [
      ...LIVING_ROOM.decorations,
      {
        kind: 'rect' as const,
        bounds: { x: 520, y: 270, width: 20, height: 34 },
        color: 0xa7614e,
        supportedBy: 'lower-shelf',
      },
    ],
  };
  const result = spawned(populate(withBooks, 'hard'));

  assert.equal(result.length, 1);
  assert.equal(result[0].placement.x, 606);
  const edge = entries.map((s) => ({ ...s, x: 1 }));

  assert.equal(spawned(populate(withSlots(edge), 'hard')).length, 0);
});

// eslint-disable-next-line max-lines-per-function -- Zusammengehörige Validierung, Platzierung oder Testschritte bleiben als atomarer Ablauf lesbar.
test('Vasen dürfen weder Ziel noch feste Vase oder Vorhang verdrängen', () => {
  const base = LIVING_ROOM.platforms[0].slots;
  const platforms = LIVING_ROOM.platforms.map((p) =>
    p.id === 'upper-shelf'
      ? {
          ...p,
          slots: { ...base, entries: base.entries.map((s, i) => ({ ...s, x: [10, 50, 50][i] })) },
        }
      : { ...p, slots: undefined },
  );
  const room = populate({ ...LIVING_ROOM, objectSlots: [], platforms }, 'hard');

  assert.deepEqual(room.objects, difficultyRoom(LIVING_ROOM, 'hard').objects);
});

// eslint-disable-next-line max-lines-per-function -- Zusammengehörige Validierung, Platzierung oder Testschritte bleiben als atomarer Ablauf lesbar.
test('Ungültige Counts, IDs und unbekannte Poolvarianten werden auch bei geringer Dichte abgewiesen', () => {
  const entries = LIVING_ROOM.platforms[0].slots.entries;

  assert.throws(
    () => populate(withSlots(entries.map((s) => ({ ...s, pool: ['missing'] }))), 'easy'),
    /unknown variant/,
  );
  assert.throws(
    () => populate(withSlots(entries.map((s) => ({ ...s, id: 'same' })))),
    /duplicate ID/,
  );
  assert.throws(() => populate(withSlots(entries.map((s) => ({ ...s, x: NaN })))), /invalid slot/);
  assert.throws(
    // eslint-disable-next-line max-lines-per-function -- Zusammengehörige Validierung, Platzierung oder Testschritte bleiben als atomarer Ablauf lesbar.
    () =>
      populate(
        {
          ...LIVING_ROOM,
          platforms: [
            {
              ...LIVING_ROOM.platforms[0],
              slots: { count: { easy: -1, normal: 2, hard: 3 }, entries },
            },
            ...LIVING_ROOM.platforms.slice(1),
          ],
        },
        'easy',
      ),
    /invalid count/,
  );
});

test('Räume ohne Slots behalten ihre Instanzen vollständig', () => {
  const room = {
    ...LIVING_ROOM,
    objectSlots: [],
    platforms: LIVING_ROOM.platforms.map((p) => ({ ...p, slots: undefined })),
  };

  assert.deepEqual(populate(room).objects, room.objects);
});

// eslint-disable-next-line max-lines-per-function -- Mehrere Seeds prüfen reale Platzierungs-/Variantenvielfalt und deterministische Wiederholung in beiden Räumen.
test('Bücher wählen passende Boden-/Regalslots und beide Erscheinungen statt fester Instanzen', () => {
  for (const source of [LIVING_ROOM, COZY_REMIX]) {
    const placements = new Set<string>();
    const variants = new Set<string>();

    for (let seed = 0; seed < 12; seed++) {
      const result = populate(source, 'normal', `books-${seed}`);
      const books = result.objects.filter((o) => o.id.startsWith('book-'));

      assert.equal(books.length, 2);
      assert.equal(
        books.filter((o) => o.placement.mode === 'surface' && o.placement.surfaceId === 'floor')
          .length,
        1,
      );
      books.forEach((book) => {
        placements.add(JSON.stringify(book.placement));
        variants.add(book.variant);
      });
      assert.deepEqual(result, populate(source, 'normal', `books-${seed}`));
    }

    assert.equal(placements.size, 4);
    assert.deepEqual([...variants].sort(), ['reading-books', 'upright-books']);
  }
});

// eslint-disable-next-line max-lines-per-function -- Zwei beschädigte Gruppen prüfen getrennt ID- und Auflagenvalidierung.
test('Auflagenübergreifende Slotgruppen prüfen IDs und Auflagen', () => {
  const group = LIVING_ROOM.objectSlots[0];

  assert.throws(
    () => populate({ ...LIVING_ROOM, objectSlots: [group, group] }),
    /invalid slot group/,
  );
  assert.throws(
    () =>
      populate({
        ...LIVING_ROOM,
        objectSlots: [{ ...group, entries: [{ ...group.entries[0], surfaceId: 'missing' }] }],
      }),
    /unknown support surface/,
  );
});
