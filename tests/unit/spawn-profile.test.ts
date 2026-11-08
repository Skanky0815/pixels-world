import assert from 'node:assert/strict';
import { test } from 'node:test';
import { OBJECTS } from '../../src/content/objects/catalog.ts';
import { LIVING_ROOM } from '../../src/content/rooms/living-room.ts';
import { COZY_REMIX } from '../../src/content/rooms/cozy-remix.ts';
import { resolveRoom } from '../../src/game/content/resolve-room.ts';
import type { ObjectCatalog } from '../../src/game/content/definitions.ts';
import {
  SPAWN_SIZES,
  spawnSizeFor,
  fitsSpawnSlot,
  filterSpawnCandidates,
  type SpawnProfile,
  type SpawnSlotFilter,
} from '../../src/game/content/spawn-profile.ts';

const shelf: SpawnSlotFilter = { capacity: 'small', categories: ['decoration'], support: 'raised' };
const vases = ['small-vase', 'blue-vase', 'heirloom-vase', 'mellow-vase'];
const books = ['reading-books', 'upright-books'];

// eslint-disable-next-line max-lines-per-function -- Alle vorhandenen Varianten werden gemeinsam auf ihre unterschiedlichen Profile geprüft.
test('Alle Bestandsvarianten haben passende Größe, Kategorie und Spawn-Eignung', () => {
  for (const key of vases) {
    assert.deepEqual(OBJECTS[key as keyof typeof OBJECTS].spawn, {
      size: 'small',
      category: 'decoration',
      random: true,
      support: 'any-surface',
    });
  }

  assert.deepEqual(OBJECTS.catgrass.spawn, {
    size: 'medium',
    category: 'plant',
    random: true,
    support: 'floor',
  });

  for (const key of ['cozy-couch', 'worn-couch', 'warm-curtain'] as const)
    assert.deepEqual(OBJECTS[key].spawn, {
      size: 'large',
      category: 'furniture',
      random: false,
      reason: 'room-fixture',
    });
  assert.deepEqual(filterSpawnCandidates(OBJECTS, shelf), vases);
});

// eslint-disable-next-line max-lines-per-function -- Die vollständige 3×3-Matrix deckt passende und zu große Inhalte für jede Größenklasse ab.
test('Größenklassen passen monoton in gleich große oder größere Slots', () => {
  for (const [itemRank, size] of SPAWN_SIZES.entries())
    for (const [slotRank, capacity] of SPAWN_SIZES.entries())
      assert.equal(
        fitsSpawnSlot({ ...OBJECTS['small-vase'].spawn, size }, ['push', 'damage'], {
          ...shelf,
          capacity,
        }),
        itemRank <= slotRank,
      );
  assert.equal(spawnSizeFor(32, 32), 'small');
  assert.equal(spawnSizeFor(32, 33), 'medium');
  assert.equal(spawnSizeFor(96, 96), 'medium');
  assert.equal(spawnSizeFor(97, 20), 'large');

  for (const invalid of [0, -1, NaN, Infinity])
    assert.throws(() => spawnSizeFor(invalid, 10), /dimensions/);
});

// eslint-disable-next-line max-lines-per-function -- Auflage, Größe, Kategorie und mehrere Fähigkeiten werden gemeinsam als Auswahlvertrag geprüft.
test('Pflanzen bleiben am Boden; mehrere benötigte Fähigkeiten gelten gemeinsam', () => {
  const floor: SpawnSlotFilter = {
    capacity: 'medium',
    categories: ['plant', 'decoration'],
    support: 'floor',
  };

  assert.deepEqual(filterSpawnCandidates(OBJECTS, floor), ['catgrass', ...vases, ...books]);
  assert.deepEqual(filterSpawnCandidates(OBJECTS, { ...floor, support: 'raised' }), [
    ...vases,
    ...books,
  ]);
  assert.deepEqual(filterSpawnCandidates(OBJECTS, { ...floor, capacity: 'small' }), vases);
  assert.deepEqual(
    filterSpawnCandidates(OBJECTS, { ...floor, requiredCapabilities: ['automatic', 'damage'] }),
    ['catgrass', ...books],
  );
  assert.deepEqual(
    filterSpawnCandidates(OBJECTS, { ...floor, requiredCapabilities: ['push', 'damage'] }),
    vases,
  );
  assert.equal(
    fitsSpawnSlot(OBJECTS['small-vase'].spawn, ['push'], {
      ...floor,
      requiredCapabilities: ['push', 'damage'],
    }),
    false,
  );
  assert.deepEqual(filterSpawnCandidates(OBJECTS, { ...floor, categories: [] }), []);
});

// eslint-disable-next-line max-lines-per-function -- Feste Ausstattung, Ziel und Figuren/Träger bleiben außerhalb des Zufallspools; beide Räume behalten ihren Zielanker.
test('Hauptziel, feste Raumausstattung, Figuren und Träger werden nicht zufällig belegt', () => {
  const all: SpawnSlotFilter = {
    capacity: 'large',
    categories: ['decoration', 'plant', 'furniture', 'toy'],
    support: 'floor',
  };

  assert.deepEqual(filterSpawnCandidates(OBJECTS, all), ['catgrass', ...vases, ...books]);
  assert.equal(fitsSpawnSlot(LIVING_ROOM.goal.spawn, [], all), false);
  assert.equal(Object.hasOwn(OBJECTS, 'favorite-ball'), false);
  assert.equal(Object.hasOwn(OBJECTS, 'pixel'), false);
  assert.equal(Object.hasOwn(OBJECTS, 'sara'), false);

  for (const room of [LIVING_ROOM, COZY_REMIX]) {
    const resolved = resolveRoom(room, OBJECTS);

    assert.equal(resolved.goal.x, 850);
    assert.equal(resolved.goal.surfaceY, 154);
    assert.equal(resolved.goal.dwellMs, 1200);

    for (const carrier of room.platforms) assert.equal(Object.hasOwn(OBJECTS, carrier.id), false);
  }
});

// eslint-disable-next-line max-lines-per-function -- Fehlende Profile und unterschiedliche semantische Fehler werden an der bestehenden Raumvalidierung geprüft.
test('Fehlende und inkonsistente Metadaten scheitern vor dem Engine-Start', () => {
  for (const [key, definition] of Object.entries(OBJECTS))
    assert.throws(
      () =>
        resolveRoom(LIVING_ROOM, {
          ...OBJECTS,
          [key]: { ...definition, spawn: undefined },
        } as unknown as ObjectCatalog),
      /spawn/,
    );

  for (const spawn of [
    { ...OBJECTS['small-vase'].spawn, size: 'giant' },
    { ...OBJECTS['small-vase'].spawn, size: 'medium' },
    { ...OBJECTS['small-vase'].spawn, category: 'plant' },
    { ...OBJECTS['small-vase'].spawn, random: 'yes' },
    { ...OBJECTS['small-vase'].spawn, support: { toString: () => 'floor' } },
    { size: 'small', category: 'decoration', random: false },
  ])
    assert.throws(
      () =>
        resolveRoom(LIVING_ROOM, {
          ...OBJECTS,
          'small-vase': { ...OBJECTS['small-vase'], spawn },
        } as unknown as ObjectCatalog),
      /spawn/,
    );
});

// eslint-disable-next-line max-lines-per-function -- Drei unzulässige Freigaben prüfen die typabhängigen Ausschlüsse vor dem Engine-Start.
test('Strukturelle Objekte und Hauptziel können nicht durch Metadaten in den Pool gelangen', () => {
  assert.throws(
    () =>
      resolveRoom(LIVING_ROOM, {
        ...OBJECTS,
        catgrass: {
          ...OBJECTS.catgrass,
          spawn: { ...OBJECTS.catgrass.spawn, support: 'any-surface' },
        },
      }),
    /floor support/,
  );
  const couchSpawn = { size: 'large', category: 'furniture', random: true, support: 'floor' };

  assert.throws(
    () =>
      resolveRoom(LIVING_ROOM, {
        ...OBJECTS,
        'cozy-couch': { ...OBJECTS['cozy-couch'], spawn: couchSpawn },
      } as unknown as ObjectCatalog),
    /structural/,
  );
  const goal = {
    ...LIVING_ROOM.goal,
    spawn: { size: 'small', category: 'toy', random: true, support: 'any-surface' },
  };

  assert.throws(
    () => resolveRoom({ ...LIVING_ROOM, goal } as unknown as typeof LIVING_ROOM, OBJECTS),
    /protected/,
  );
});

// eslint-disable-next-line max-lines-per-function -- Ungültige Filterwerte und ein widersprüchliches Profil prüfen getrennte Validierungsgrenzen.
test('Ungültige Filter und widersprüchliche Profile werden abgewiesen', () => {
  for (const filter of [
    { ...shelf, capacity: 'giant' },
    { ...shelf, categories: ['unknown'] },
    { ...shelf, categories: ['decoration', 'decoration'] },
    { ...shelf, support: 'ceiling' },
    { ...shelf, requiredCapabilities: ['unknown'] },
    { ...shelf, requiredCapabilities: ['push', 'push'] },
  ])
    assert.throws(
      () => filterSpawnCandidates(OBJECTS, filter as unknown as SpawnSlotFilter),
      /spawnSlot/,
    );
  assert.throws(
    () =>
      fitsSpawnSlot(
        { ...OBJECTS['small-vase'].spawn, reason: 'main-goal' } as unknown as SpawnProfile,
        [],
        shelf,
      ),
    /exclusion/,
  );
});

test('Die Auswahl verändert weder Katalog noch Filter und bleibt deterministisch', () => {
  const before = JSON.stringify([OBJECTS, shelf]);

  assert.deepEqual(filterSpawnCandidates(OBJECTS, shelf), filterSpawnCandidates(OBJECTS, shelf));
  assert.equal(JSON.stringify([OBJECTS, shelf]), before);
});
