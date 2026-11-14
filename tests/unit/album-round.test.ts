/* eslint-disable max-lines-per-function -- Vollständige Abschluss-, Speicher- und Abbruchfälle prüfen den gemeinsamen Transaktionsvertrag. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AlbumCollection, ALBUM_STORAGE_KEY } from '../../src/game/album/collection.ts';
import { RoundAlbum } from '../../src/game/album/round.ts';
import { RoundController } from '../../src/game/domain/round-controller.ts';
import { HomecomingSequence } from '../../src/game/domain/homecoming.ts';
import { Reconciliation } from '../../src/game/domain/reconciliation.ts';
import { roundResult } from '../../src/game/domain/round-result.ts';
import { CHARM_TIMING } from '../../src/content/reconciliation.ts';

const ids = new Set(['vase.blue', 'couch.cozy', 'plant.grass']);

function memory(raw: string | null = null) {
  let value = raw;
  let writes = 0;

  return {
    getItem: () => value,
    setItem: (_key: string, next: string) => {
      writes++;
      value = next;
    },
    writes: () => writes,
  };
}

function game(score = 25, goalReached = false) {
  const round = new RoundController({
    minDurationMs: goalReached ? 100 : 1,
    maxDurationMs: goalReached ? 100 : 1,
  });
  const home = new HomecomingSequence();
  const charm = new Reconciliation(() => 0);

  round.advance(1, score, true, goalReached);
  home.start(score, () => 0);
  home.advance(2100);
  home.confirm();
  charm.start(score);

  return { charm, result: () => roundResult(round.snapshot(), home.snapshot(), charm.snapshot()) };
}

function heart(charm: Reconciliation) {
  charm.confirm();

  for (let index = 0; index < charm.snapshot().length; index++) {
    charm.advance(CHARM_TIMING.cueMs);
    charm.input(['left']);
  }
}

function finish(model: ReturnType<typeof game>, success: boolean, partial = 0) {
  const { charm } = model;

  if (success) {
    for (let index = 0; index < charm.snapshot().required; index++) heart(charm);
    charm.advance(CHARM_TIMING.finaleMs);
  } else {
    for (let index = 0; index < partial; index++) heart(charm);

    for (let index = 0; index < 2; index++) {
      charm.confirm();
      charm.advance(CHARM_TIMING.cueMs);
      charm.input(['right']);
    }
  }

  return model.result();
}

test('Vorläufige bekannte Varianten sind dedupliziert und vor der Auswertung unsichtbar', () => {
  const storage = memory();
  const collection = new AlbumCollection(ids, storage);
  const round = new RoundAlbum(collection);
  let notifications = 0;

  collection.subscribe(() => notifications++);
  assert.equal(round.record('vase.blue'), true);
  assert.equal(round.record('vase.blue'), false);
  assert.equal(round.record('unknown'), false);
  assert.deepEqual(round.confirm(null), []);
  assert.deepEqual(collection.snapshot().discovered, []);
  assert.deepEqual(round.snapshot().pending, ['vase.blue']);
  assert.equal(round.snapshot().completed, false);
  assert.equal(storage.getItem(), null);
  assert.equal(storage.writes(), 0);
  assert.equal(notifications, 0);
  assert.equal(Object.isFrozen(round.snapshot().pending), true);
});

test('Rundenabschluss übernimmt alle Funde mit genau einem Schreibvorgang und einer Benachrichtigung', () => {
  const storage = memory();
  const collection = new AlbumCollection(ids, storage);
  const round = new RoundAlbum(collection);
  let notifications = 0;

  collection.subscribe(() => {
    notifications++;
    assert.deepEqual(collection.snapshot().discovered, ['vase.blue', 'couch.cozy']);
  });
  round.record('vase.blue');
  round.record('couch.cozy');
  const result = finish(game(), true);

  assert.ok(result);
  assert.deepEqual(round.confirm(result), ['vase.blue', 'couch.cozy']);
  assert.deepEqual(round.confirm(result), ['vase.blue', 'couch.cozy']);
  assert.equal(round.record('plant.grass'), false);
  assert.equal(storage.writes(), 1);
  assert.deepEqual(round.savedDiscoveries(), ['vase.blue', 'couch.cozy']);
  assert.equal(Object.isFrozen(round.savedDiscoveries()), true);
  assert.equal(notifications, 1);
  assert.deepEqual(JSON.parse(storage.getItem()!), {
    version: 2,
    discovered: ['vase.blue', 'couch.cozy'],
    achievements: {
      reconciliations: 1,
      ruined: [],
      ruinedVariants: [],
      completedRooms: [],
      unlocked: ['achievement.angel-1'],
    },
  });
  assert.deepEqual(round.snapshot().pending, []);
  assert.equal(round.snapshot().completed, true);
});

test('Nur vollständige Versöhnung bestätigt Funde; Scheitern verwirft sie auch mit Teilherzen', () => {
  for (const [score, success, partial, hearts] of [
    [0, true, 0, 1],
    [25, true, 0, 2],
    [60, true, 0, 3],
    [25, false, 0, 0],
    [60, false, 1, 1],
  ] as const) {
    const storage = memory(JSON.stringify({ version: 1, discovered: ['couch.cozy'] }));
    const collection = new AlbumCollection(ids, storage);
    const round = new RoundAlbum(collection);
    const result = finish(game(score), success, partial);

    round.record('vase.blue');
    assert.ok(result);
    assert.equal(result.hearts, hearts);
    assert.deepEqual(round.confirm(result), success ? ['vase.blue'] : []);
    assert.deepEqual(
      collection.snapshot().discovered,
      success ? ['couch.cozy', 'vase.blue'] : ['couch.cozy'],
    );
    assert.deepEqual(round.savedDiscoveries(), success ? ['vase.blue'] : []);
    assert.deepEqual(round.snapshot().pending, []);
    assert.equal(storage.writes(), success ? 1 : 0);

    if (!success) assert.deepEqual(round.confirm(finish(game(), true)), []);
  }
});

test('Abbruch, neue Szene und Reload verlieren nur die unbestätigten Funde', () => {
  const storage = memory(JSON.stringify({ version: 1, discovered: ['couch.cozy'] }));
  const collection = new AlbumCollection(ids, storage);
  const abandoned = new RoundAlbum(collection);

  assert.equal(abandoned.record('couch.cozy'), false);
  abandoned.record('vase.blue');
  assert.deepEqual(new RoundAlbum(collection).snapshot().pending, []);
  assert.deepEqual(new AlbumCollection(ids, storage).snapshot().discovered, ['couch.cozy']);
  assert.equal(storage.writes(), 0);
});

test('Bereits bestätigte Varianten zählen nicht erneut, auch bei konkurrierender Bestätigung', () => {
  const storage = memory();
  const collection = new AlbumCollection(ids, storage);
  const round = new RoundAlbum(collection);

  round.record('vase.blue');
  collection.unlock('vase.blue');
  assert.deepEqual(round.confirm(finish(game(), true)), []);
  assert.deepEqual(round.savedDiscoveries(), []);
  assert.equal(storage.writes(), 2);
  assert.deepEqual(new RoundAlbum(collection).confirm(finish(game(), true)), []);
  assert.equal(storage.writes(), 3);
});

test('Migration, geschützter neuerer Speicher und blockierter Storage bleiben erhalten', () => {
  const old = memory(JSON.stringify({ version: 0, unlocked: ['couch.cozy'] }));
  const migrated = new AlbumCollection(ids, old);
  const round = new RoundAlbum(migrated);

  round.record('vase.blue');
  round.confirm(finish(game(), true));
  assert.deepEqual(new AlbumCollection(ids, old).snapshot().discovered, [
    'couch.cozy',
    'vase.blue',
  ]);
  const future = memory(JSON.stringify({ version: 9, discovered: ['future'] }));
  const protectedRound = new RoundAlbum(new AlbumCollection(ids, future));

  protectedRound.record('vase.blue');
  protectedRound.confirm(finish(game(), true));
  assert.equal(future.writes(), 0);
  const blocked = new AlbumCollection(ids, {
    getItem: () => null,
    setItem: () => {
      throw new Error('blocked');
    },
  });
  const session = new RoundAlbum(blocked);

  session.record('vase.blue');
  assert.deepEqual(session.confirm(finish(game(), true)), ['vase.blue']);
  assert.equal(blocked.snapshot().storage, 'unavailable');
  assert.equal(ALBUM_STORAGE_KEY, 'pixels-world.album');
});

test('Banner zeigen neue Freischaltungen auch ohne dauerhafte Speicherung und werden nicht nachgeholt', () => {
  for (const [storage, remember] of [
    [memory(), false],
    [memory(JSON.stringify({ version: 9, discovered: ['future'] })), true],
    [
      {
        getItem: () => null,
        setItem: () => {
          throw new Error('quota');
        },
      },
      true,
    ],
  ] as const) {
    const collection = new AlbumCollection(ids, storage, remember);
    const round = new RoundAlbum(collection);

    round.record('vase.blue');
    assert.deepEqual(round.confirm(finish(game(), true)), ['vase.blue']);
    assert.deepEqual(round.savedDiscoveries(), []);
    assert.ok(round.confirmedBanners().includes('vase.blue'));
    collection.setRemember(true);
    round.confirm(finish(game(), true));
    assert.deepEqual(round.savedDiscoveries(), []);
  }
});

test('Erfolgreicher Schreibversuch nach korrupten Daten oder vorigem Speicherfehler erlaubt Banner', () => {
  let blocked = true;
  const storage = {
    getItem: () => null,
    setItem: () => {
      if (blocked) throw new Error('quota');
    },
  };
  const recovered = new AlbumCollection(ids, storage);

  recovered.unlock('couch.cozy');
  assert.equal(recovered.snapshot().storage, 'unavailable');
  blocked = false;

  for (const collection of [recovered, new AlbumCollection(ids, memory('{'))]) {
    const round = new RoundAlbum(collection);

    round.record('vase.blue');
    round.confirm(finish(game(), true));
    assert.equal(collection.snapshot().storage, 'ready');
    assert.deepEqual(round.savedDiscoveries(), ['vase.blue']);
  }
});

test('Napffund erscheint nur nach erfolgreicher Versöhnung und über die gemeinsame einmalige Bannerfolge ohne Speicherwahl', () => {
  for (const success of [true, false]) {
    const collection = new AlbumCollection(new Set(['goal.food-bowl']), undefined, false);
    const round = new RoundAlbum(collection);

    assert.equal(round.record('goal.food-bowl'), true);
    assert.equal(round.record('goal.food-bowl'), false);
    assert.deepEqual(collection.snapshot().discovered, []);
    const result = finish(game(25, true), success);

    assert.ok(result?.goalReached);
    round.confirm(result, 'kitchen-preview');
    assert.deepEqual(collection.snapshot().discovered, success ? ['goal.food-bowl'] : []);
    assert.equal(
      round.confirmedBanners().filter((id) => id === 'goal.food-bowl').length,
      success ? 1 : 0,
    );
    assert.deepEqual(round.savedDiscoveries(), []);
    const again = new RoundAlbum(collection);

    assert.equal(again.record('goal.food-bowl'), !success);
  }
});
