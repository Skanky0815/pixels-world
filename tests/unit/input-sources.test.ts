/* eslint-disable max-lines-per-function -- Quellfolgen prüfen den öffentlichen Eingabevertrag über mehrere Frames. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { InputSources, type InputSource } from '../../game/play/input/input-sources.ts';
import { keyboardBindings, directionForCode } from '../../game/shared/input/keyboard-bindings.ts';
import {
  KeyboardPreferences,
  WASD_STORAGE_KEY,
} from '../../game/shared/input/keyboard-preferences.ts';

const source = (id: string, action: InputSource['action'], pressed = false, held = true) => ({
  id,
  action,
  held,
  pressed,
});

test('WASD ergänzt die bestehenden Bindungen nur bei aktivierter Option', () => {
  assert.equal(directionForCode('KeyA', false), undefined);
  assert.equal(directionForCode('KeyA', true), 'left');
  assert.equal(directionForCode('KeyD', true), 'right');
  assert.equal(directionForCode('KeyW', true), 'up');
  assert.equal(directionForCode('KeyS', true), 'down');
  assert.equal(directionForCode('Space', true), undefined);
  assert.deepEqual(
    keyboardBindings(true).filter((binding) => !binding.wasd),
    keyboardBindings(false),
  );
});

test('Gleiche Richtungen erzeugen eine Flanke; einzelne Freigaben erhalten andere Quellen', () => {
  const input = new InputSources();
  const a = source('KeyA', 'left');
  const arrow = source('ArrowLeft', 'left');

  assert.deepEqual(
    input.read([
      { ...a, pressed: true },
      { ...arrow, pressed: true },
    ]).arrows,
    ['left'],
  );
  assert.deepEqual(input.read([a, arrow]).arrows, []);
  assert.equal(input.read([arrow]).horizontal, -1);
  assert.equal(input.read([]).horizontal, 0);
  input.read([{ ...a, pressed: true }]);
  assert.deepEqual(input.read([a, { ...arrow, pressed: true }]).arrows, []);
  assert.equal(input.read([arrow]).horizontal, -1);
});

test('Gegensätze neutralisieren Bewegung und bleiben als mehrdeutige frische Richtungen erhalten', () => {
  const input = new InputSources();
  const state = input.read([source('KeyA', 'left', true), source('ArrowRight', 'right', true)]);

  assert.equal(state.horizontal, 0);
  assert.deepEqual([...state.arrows].sort(), ['left', 'right']);
  assert.equal(Object.isFrozen(state.arrows), true);
});

test('Touch und Tastatur teilen Flanken; erneutes Drücken zwischen Frames bleibt frisch', () => {
  const input = new InputSources();
  const a = source('KeyA', 'left');

  input.read([{ ...a, pressed: true }]);
  assert.deepEqual(input.read([a, source('touch:left', 'left', true)]).arrows, []);
  assert.deepEqual(input.read([{ ...a, pressed: true }]).arrows, ['left']);
  assert.equal(input.read([source('touch:jump', 'jump', true, false)]).confirmPressed, true);
  assert.equal(input.read([]).confirmPressed, false);
  input.clear();
  assert.deepEqual(input.read([source('ArrowUp', 'up', true)]).arrows, ['up']);
});

test('WASD ist standardmäßig aus, wird gespeichert und wiederhergestellt', () => {
  const data = new Map<string, string>();
  const storage = {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
  const preferences = new KeyboardPreferences(storage);
  let changes = 0;
  const unsubscribe = preferences.subscribe(() => changes++);

  assert.equal(preferences.snapshot(), false);
  preferences.setEnabled(true);
  preferences.setEnabled(true);
  assert.equal(changes, 1);
  assert.equal(data.get(WASD_STORAGE_KEY), 'true');
  assert.equal(new KeyboardPreferences(storage).snapshot(), true);
  unsubscribe();
  preferences.setEnabled(false);
  assert.equal(changes, 1);
});

test('Blockierter Speicher lässt die WASD-Sitzung bedienbar', () => {
  const preferences = new KeyboardPreferences({
    getItem() {
      throw new Error('blocked');
    },
    setItem() {
      throw new Error('blocked');
    },
  });

  assert.equal(preferences.snapshot(), false);
  preferences.setEnabled(true);
  assert.equal(preferences.snapshot(), true);
});

test('Überlappende Quellen wechseln zwischen Frames ohne neue Flanke; vollständiges Loslassen erlaubt sie wieder', () => {
  const input = new InputSources();

  assert.equal(input.press('KeyA', 'left'), true);
  assert.equal(input.press('ArrowLeft', 'left'), false);
  input.releaseSource('KeyA');
  assert.equal(input.press('KeyA', 'left'), false);
  input.releaseSource('ArrowLeft');
  assert.equal(input.press('touch:1', 'left'), false);
  input.releaseSource('KeyA');
  assert.equal(input.press('KeyD', 'right'), true);
  input.releaseSource('touch:1');
  assert.equal(input.press('KeyA', 'left'), true);
  input.clear();
  assert.equal(input.press('KeyA', 'left'), true);
});
