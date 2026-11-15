import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  PLAYGROUND_SCENARIOS,
  parsePlaygroundSelection,
  selectedPlaygroundRoom,
  playgroundSelectionSearch,
  playgroundGameLink,
  playgroundChoices,
} from '../../game/dev/playground-selection.ts';
import { PLAYGROUND_OBJECTS } from '../../game/dev/playground-room.ts';
import { LAB_ROOMS } from '../../game/play/content/rooms/scenarios.ts';

// eslint-disable-next-line max-lines-per-function -- Jeder bestehende Laboraufbau wird unverändert über den echten Resolver angeboten.
test('Alle Laborszenarien verwenden ihre ursprünglichen Raum-, Spawn- und Objektdaten', () => {
  assert.equal(PLAYGROUND_SCENARIOS['fridge-incoming'], LAB_ROOMS['fridge-incoming']);
  const before = JSON.stringify(LAB_ROOMS);

  for (const [id, definition] of Object.entries(LAB_ROOMS)) {
    const room = selectedPlaygroundRoom({ mode: 'scenario', id });

    assert.equal(room.definition, definition);
    assert.equal(room.objects.length, definition.objects.length);
    assert.ok(room.spawn.x >= 0 && room.spawn.x <= definition.width);
  }

  assert.equal(JSON.stringify(LAB_ROOMS), before);
  assert.deepEqual(
    playgroundChoices('scenario').map((choice) => choice.id),
    Object.keys(PLAYGROUND_SCENARIOS),
  );
});

// eslint-disable-next-line max-lines-per-function -- Beide Kataloge müssen über stabile URLs dieselbe Auswahl wiederherstellen.
test('Objekt- und Szenarioauswahl sind vollständig über teilbare URLs erreichbar', () => {
  for (const [mode, catalog] of [
    ['object', PLAYGROUND_OBJECTS],
    ['scenario', LAB_ROOMS],
  ] as const) {
    for (const id of Object.keys(catalog)) {
      const selection = { mode, id };

      assert.deepEqual(parsePlaygroundSelection(playgroundSelectionSearch(selection)), selection);
    }
  }

  assert.deepEqual(parsePlaygroundSelection(''), { mode: 'object', id: 'cozy-couch' });
  assert.deepEqual(parsePlaygroundSelection('?scenario=fridge-incoming'), {
    mode: 'scenario',
    id: 'fridge-incoming',
  });
  assert.equal(
    playgroundGameLink({ mode: 'scenario', id: 'fridge-incoming' }),
    '/play.html?scenario=fridge-incoming&camera=room',
  );
  assert.equal(playgroundGameLink({ mode: 'object', id: 'cozy-couch' }), undefined);
});

// eslint-disable-next-line max-lines-per-function -- Die zusammengehörigen Welt-, Möbel- und Spawnwerte schützen den realen Kühlschrank-Aufbau.
test('Kühlschrankszenario behält echte große Welt, feste Möbel und fallendes Glas', () => {
  const room = selectedPlaygroundRoom({ mode: 'scenario', id: 'fridge-incoming' });

  assert.deepEqual([room.definition.width, room.definition.height], [1320, 540]);
  assert.equal(
    room.definition.platforms.find((p) => p.id === 'kitchen-fridge')?.appearance,
    'fridge',
  );
  assert.equal(room.objects.find((object) => object.id === 'source-jar')?.kind, 'pantry');
  assert.equal(room.spawn.x, 930);
  assert.ok(
    playgroundChoices('scenario')
      .find((choice) => choice.id === 'fridge-incoming')
      ?.label.startsWith('Kühlschrank'),
  );
});

test('Unbekannte oder geerbte Auswahlschlüssel werden vor der Szenenerzeugung abgewiesen', () => {
  for (const id of ['missing', 'toString', 'constructor', '__proto__']) {
    assert.throws(
      () => parsePlaygroundSelection(`?scenario=${id}`),
      /Unbekannte Playground-Auswahl/,
    );
    assert.throws(() => parsePlaygroundSelection(`?object=${id}`), /Unbekannte Playground-Auswahl/);
  }

  assert.throws(() => selectedPlaygroundRoom({ mode: 'scenario', id: 'cozy-couch' }));
});

// eslint-disable-next-line max-lines-per-function -- Beide Kataloggrenzen müssen unabhängig von geerbten Schlüsseln und Produktionsparametern gelten.
test('Alte Labor-Raumzugänge sind entfernt; nur explizite Rundenszenarien bleiben im Spiel', async () => {
  const { selectRoom } = await import('../../game/play/content/rooms/index.ts');
  const { roundScenario, ROUND_SCENARIOS } =
    await import('../../game/play/content/rooms/scenarios.ts');

  for (const id of [...Object.keys(LAB_ROOMS), 'kitchen-preview']) {
    assert.throws(() => selectRoom(id, true), /Unknown room/);
    assert.equal(selectRoom(id, false).id, 'living-room');
  }

  for (const id of Object.keys(ROUND_SCENARIOS)) assert.equal(roundScenario(id).id, id);

  for (const id of ['impact-vases', 'dish-cups', 'toString', '__proto__'])
    assert.throws(() => roundScenario(id), /Unknown round scenario/);
  assert.equal(playgroundGameLink({ mode: 'scenario', id: 'impact-vases' }), undefined);
});

test('Rundenlink erhält den gewählten Raumseed', () => {
  assert.equal(
    playgroundGameLink({ mode: 'scenario', id: 'kitchen-preview' }, 'bags-7'),
    '/play.html?scenario=kitchen-preview&camera=room&room-seed=bags-7',
  );
});
