/* eslint-disable max-lines-per-function -- Die Katalog- und Importgrenzen werden als vollständige Datenverträge geprüft. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  PLAYGROUND_SCENARIOS,
  parsePlaygroundSelection,
  selectedPlaygroundRoom,
  playgroundSelectionSearch,
  playgroundGameLink,
} from '../../game/dev/playground-selection.ts';
import { PLAYGROUND_OBJECTS } from '../../game/dev/playground-room.ts';
import { ROUND_SCENARIOS, roundScenario } from '../../game/play/content/rooms/scenarios.ts';
import { selectRoom } from '../../game/play/content/rooms/index.ts';

test('Nur Grundaufbauten und Objektvarianten sind über Spielwiesen-URLs auswählbar', () => {
  assert.deepEqual(Object.keys(PLAYGROUND_SCENARIOS), [
    'empty',
    'living-room',
    'cozy-remix',
    'kitchen-preview',
  ]);

  for (const [mode, catalog] of [
    ['object', PLAYGROUND_OBJECTS],
    ['scenario', PLAYGROUND_SCENARIOS],
  ] as const)
    for (const id of Object.keys(catalog))
      assert.deepEqual(parsePlaygroundSelection(playgroundSelectionSearch({ mode, id })), {
        mode,
        id,
      });
  assert.equal(selectedPlaygroundRoom({ mode: 'scenario', id: 'empty' }).objects.length, 0);
});

test('Laborräume und geerbte Schlüssel sind keine auswählbaren Räume mehr', () => {
  for (const id of ['impact-vases', 'dish-cups', 'fridge-incoming', 'constructor', '__proto__']) {
    assert.throws(() => parsePlaygroundSelection(`?scenario=${id}`));
    assert.throws(() => selectRoom(id, true));
    assert.equal(selectRoom(id, false).id, 'living-room');
  }

  for (const id of Object.keys(ROUND_SCENARIOS)) assert.equal(roundScenario(id).id, id);
  assert.throws(() => roundScenario('impact-vases'));
});

test('Nur vollständige Runden-Fixtures erhalten einen Spiel-Link mit demselben Seed', () => {
  assert.equal(playgroundGameLink({ mode: 'scenario', id: 'impact-vases' }), undefined);
  assert.equal(playgroundGameLink({ mode: 'object', id: 'cozy-couch' }), undefined);
  assert.equal(
    playgroundGameLink({ mode: 'scenario', id: 'kitchen-preview' }, 'bags-7'),
    '/play.html?scenario=kitchen-preview&camera=room&room-seed=bags-7',
  );
});
