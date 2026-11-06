import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PointerActions } from '../../src/game/input/pointer-actions.ts';

// eslint-disable-next-line max-lines-per-function -- Zwei Finger und ihre getrennte Freigabe werden in einer zusammenhängenden Besitzfolge geprüft.
test('Pointer: Ein Finger löst die gehaltene Aktion eines anderen nicht', () => {
  const actions = new PointerActions();

  actions.press(1, 'right');
  actions.press(2, 'jump');
  assert.deepEqual(actions.read(), { held: ['right', 'jump'], pressed: ['right', 'jump'] });
  actions.release(2);
  assert.deepEqual(actions.read(), { held: ['right'], pressed: [] });
  actions.press(3, 'right');
  assert.deepEqual(actions.read().pressed, []);
  actions.release(1);
  assert.equal(actions.held('right'), true);
  actions.release(3);
  assert.equal(actions.held('right'), false);
});

test('Pointer: Gehaltenes Springen erzeugt genau eine neue Flanke', () => {
  const actions = new PointerActions();

  actions.press(1, 'jump');
  assert.deepEqual(actions.read().pressed, ['jump']);
  actions.press(1, 'jump');
  assert.deepEqual(actions.read().pressed, []);
  actions.release(1);
  actions.press(1, 'jump');
  assert.deepEqual(actions.read().pressed, ['jump']);
});

// eslint-disable-next-line max-lines-per-function -- Kurzer Tap und unveränderlicher Snapshot prüfen die Grenze zwischen DOM-Ereignis und nächstem Spielframe.
test('Pointer: Kurzer Tap bleibt bis zum Frame lesbar; Snapshots sind unveränderlich', () => {
  const actions = new PointerActions();

  actions.press(4, 'up');
  actions.release(4);
  const snapshot = actions.read();

  assert.deepEqual(snapshot, { held: [], pressed: ['up'] });
  assert.equal(Object.isFrozen(snapshot), true);
  assert.equal(Object.isFrozen(snapshot.held), true);
  assert.throws(() => (snapshot.pressed as string[]).push('down'));
  assert.deepEqual(actions.read().pressed, []);
});

// eslint-disable-next-line max-lines-per-function -- Abbruch verwirft unbestätigte Flanken, ohne fremde Fingerbesitzer zu verändern.
test('Pointer: Abbruch und Lebenszyklus-Cleanup löschen gehaltene Eingaben und Flanken', () => {
  const actions = new PointerActions();

  actions.press(1, 'jump');
  actions.release(1, true);
  assert.deepEqual(actions.read(), { held: [], pressed: [] });
  actions.press(2, 'left');
  actions.press(3, 'reset');
  actions.clear();
  assert.deepEqual(actions.read(), { held: [], pressed: [] });
  assert.deepEqual(actions.ids(), []);
  actions.press(4, 'left');
  assert.deepEqual(actions.read().pressed, ['left']);
});
