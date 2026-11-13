/* eslint-disable max-lines-per-function -- Speichergrenzen werden mit beobachtbaren Lese-/Schreibzugriffen geprüft. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { StorageChoices } from '../../src/settings/storage.ts';
import { AlbumCollection } from '../../src/game/album/collection.ts';

for (const raw of [null, '{', 'null', '{"album":"true","offline":1}'])
  test(`Optionale Speicherung bleibt ohne gültige Auswahl aus: ${raw}`, () => {
    const choices = new StorageChoices({ getItem: () => raw, setItem: () => assert.fail('write') });

    assert.deepEqual(choices.snapshot(), { album: false, offline: false });
  });

test('Zwei Speicherfunktionen sind unabhängig und reagieren auf einen anderen Tab', () => {
  let saved = '';
  const choices = new StorageChoices({
    getItem: () => null,
    setItem: (_, value) => {
      saved = value;
    },
  });

  choices.set('album', true);
  assert.deepEqual(JSON.parse(saved), { album: true, offline: false });
  choices.restore('{"album":false,"offline":true}');
  assert.deepEqual(choices.snapshot(), { album: false, offline: true });
});

test('Bestehendes Album wird erst auf Wunsch gelesen; Opt-out erhält gespeicherte Funde unverändert', () => {
  let reads = 0,
    writes = 0;
  let saved = JSON.stringify({ version: 0, unlocked: ['vase.blue'] });
  const album = new AlbumCollection(
    new Set(['vase.blue', 'couch.cozy', 'books']),
    {
      getItem: () => {
        reads++;

        return saved;
      },
      setItem: (_, value) => {
        writes++;
        saved = value;
      },
    },
    false,
  );

  album.unlock('couch.cozy');
  assert.deepEqual([reads, writes], [0, 0]);
  assert.equal(album.snapshot().storage, 'session');
  album.setRemember(true);
  assert.deepEqual(new Set(album.snapshot().discovered), new Set(['vase.blue', 'couch.cozy']));
  assert.equal(JSON.parse(saved).version, 1);
  const retained = saved;

  album.setRemember(false);
  album.unlock('books');
  assert.equal(saved, retained);
  const next = new AlbumCollection(
    new Set(['vase.blue', 'couch.cozy']),
    { getItem: () => saved, setItem: () => assert.fail('write') },
    false,
  );

  assert.deepEqual(next.snapshot().discovered, []);
  album.reset();
  assert.deepEqual(JSON.parse(saved).discovered, []);
});
