/* eslint-disable max-lines-per-function -- Ereignis-, Speicher- und Migrationsfälle prüfen vollständige Verträge mit echten Katalogdaten. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { ALBUM_ART } from '../../src/game/ui/album-art.ts';
import { AlbumCollection, ALBUM_STORAGE_KEY } from '../../src/game/album/collection.ts';
import { INTERACTABLE_ALBUM, discoverAlbum, albumEntries } from '../../src/content/album/index.ts';
import { OBJECTS } from '../../src/content/objects/catalog.ts';
import { chaosEvent } from '../../src/game/domain/chaos-event.ts';
const ids = new Set(Object.values(INTERACTABLE_ALBUM).map((entry) => entry.id));

function memory(initial: string | null = null) {
  let value = initial;

  return {
    getItem: () => value,
    setItem: (_key: string, next: string) => {
      value = next;
    },
  };
}

test('Jede reale Objektvariante besitzt genau eine stabile, lokalisierte Album-ID und echte Erfolgsregel', () => {
  assert.deepEqual(
    Object.keys(INTERACTABLE_ALBUM)
      .filter((key) => key !== 'food-bowl')
      .sort(),
    Object.keys(OBJECTS).sort(),
  );
  assert.equal(ids.size, Object.keys(INTERACTABLE_ALBUM).length);

  for (const [variant, definition] of Object.entries(OBJECTS)) {
    const entry = definition.album;

    assert.ok(
      entry.name.de &&
        entry.name.en &&
        entry.fluff.de &&
        entry.fluff.en &&
        entry.sara.de &&
        entry.sara.en,
    );
    assert.equal(entry, OBJECTS[variant as keyof typeof OBJECTS].album);
    assert.deepEqual(entry.rooms, ['living-room']);
    const event = chaosEvent('random-instance', entry.condition.kind, 1, 1);

    assert.equal(discoverAlbum(event, variant)?.entryId, entry.id);
    assert.equal(
      discoverAlbum(chaosEvent('random-instance', entry.condition.kind, 2, 1), variant),
      null,
    );
    assert.equal(discoverAlbum(event, 'unknown'), null);
  }
});
test('Mehrere Instanzen, Räume und Neustarts zählen dieselbe Variante einmal', () => {
  const storage = memory();
  const album = new AlbumCollection(ids, storage);
  let notifications = 0;
  const remove = album.subscribe(() => notifications++);

  assert.equal(album.unlock('vase.blue'), true);
  assert.equal(album.unlock('vase.blue'), false);
  assert.equal(album.unlock('random-instance'), false);
  assert.deepEqual(new AlbumCollection(ids, storage).snapshot().discovered, ['vase.blue']);
  assert.equal(notifications, 1);
  assert.ok(Object.isFrozen(album.snapshot().discovered));
  remove();
  album.reset();
  assert.equal(notifications, 1);
  assert.deepEqual(new AlbumCollection(ids, storage).snapshot().discovered, []);
});
test('Version 0 wird migriert; unbekannte IDs und Duplikate erzeugen keinen Fortschritt', () => {
  const storage = memory(
    JSON.stringify({ version: 0, unlocked: ['vase.blue', 'vase.blue', 'removed'] }),
  );

  assert.deepEqual(new AlbumCollection(ids, storage).snapshot().discovered, ['vase.blue']);
  assert.deepEqual(JSON.parse(storage.getItem()!), {
    version: 2,
    discovered: ['vase.blue'],
    achievements: {
      reconciliations: 0,
      ruined: [],
      ruinedVariants: [],
      completedRooms: [],
      unlocked: [],
    },
  });
});
test('Korruptes Album startet leer und kann durch neue Schandtaten wieder gespeichert werden', () => {
  for (const raw of [
    '{',
    'null',
    '{}',
    '{"version":1,"discovered":[7]}',
    '{"version":1,"discovered":null}',
  ]) {
    const storage = memory(raw);
    const album = new AlbumCollection(ids, storage);

    assert.equal(album.snapshot().storage, 'recovered');
    assert.deepEqual(album.snapshot().discovered, []);
    album.unlock('vase.blue');
    assert.deepEqual(new AlbumCollection(ids, storage).snapshot().discovered, ['vase.blue']);
  }
});
test('Neuere Speicherversionen werden erst nach ausdrücklich bestätigtem Reset überschrieben', () => {
  const original = JSON.stringify({ version: 9, discovered: ['future'] });
  const storage = memory(original);
  const album = new AlbumCollection(ids, storage);

  assert.equal(album.snapshot().storage, 'newer');
  album.unlock('vase.blue');
  assert.equal(storage.getItem(), original);
  album.reset();
  assert.deepEqual(JSON.parse(storage.getItem()!), {
    version: 2,
    discovered: [],
    achievements: {
      reconciliations: 0,
      ruined: [],
      ruinedVariants: [],
      completedRooms: [],
      unlocked: [],
    },
  });
});
test('Blockierter Lese-/Schreibzugriff verliert keine sitzungsweite Entdeckung', () => {
  const blocked = {
    getItem: () => {
      throw new Error('blocked');
    },
    setItem: () => {
      throw new Error('blocked');
    },
  };

  for (const storage of [undefined, blocked, { getItem: () => null, setItem: blocked.setItem }]) {
    const album = new AlbumCollection(ids, storage);

    album.unlock('vase.blue');
    assert.equal(album.snapshot().storage, 'unavailable');
    assert.deepEqual(album.snapshot().discovered, ['vase.blue']);
  }

  assert.equal(ALBUM_STORAGE_KEY, 'pixels-world.album');
});

test('Veröffentlichte Sammlung enthält keine nur im DEV-Raum erreichbare Variante', () => {
  assert.equal(albumEntries(false).length, 13);
  assert.equal(albumEntries(true).length, 15);
  assert.equal(
    albumEntries(false).some((entry) => entry.id === 'couch.worn'),
    false,
  );
  assert.equal(
    albumEntries(true).some((entry) => entry.id === 'couch.worn'),
    true,
  );
});

test('Jeder Album-Eintrag verweist auf eine vorhandene echte PNG-Grafik', () => {
  for (const entry of Object.values(INTERACTABLE_ALBUM)) {
    const source = ALBUM_ART[entry.asset];

    assert.ok(source, entry.asset);
    assert.deepEqual(
      [...readFileSync(new URL(source)).subarray(0, 8)],
      [137, 80, 78, 71, 13, 10, 26, 10],
    );
  }
});
