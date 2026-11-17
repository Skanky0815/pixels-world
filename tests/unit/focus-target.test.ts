import assert from 'node:assert/strict';
import { test } from 'node:test';
import { nextFocusIndex } from '../../game/shared/ui/focus-target.ts';

const box = (left: number, top: number, width = 100, height = 44) => ({ left, top, width, height });

test('Lineare Navigation bleibt an beiden Rändern und verändert native Querachsen nicht', () => {
  const targets = [box(0, 0), box(0, 60), box(0, 120)];

  assert.equal(nextFocusIndex([], -1, 'down'), -1);
  assert.equal(nextFocusIndex(targets, -1, 'down'), 0);
  assert.equal(nextFocusIndex(targets, 0, 'up'), 0);
  assert.equal(nextFocusIndex(targets, 0, 'down'), 1);
  assert.equal(nextFocusIndex(targets, 2, 'down'), 2);
  assert.equal(nextFocusIndex(targets, 1, 'left'), 1);
});

test('Raumraster folgt bedienbaren Karten, überspringt Lücken und startet nichts', () => {
  const targets = [box(220, 0), box(0, 80, 180, 100), box(220, 80, 180, 100), box(300, 300)];

  assert.equal(nextFocusIndex(targets, 1, 'right', true), 2);
  assert.equal(nextFocusIndex(targets, 2, 'left', true), 1);
  assert.equal(nextFocusIndex(targets, 2, 'up', true), 0);
  assert.equal(nextFocusIndex(targets, 2, 'down', true), 3);
  assert.equal(nextFocusIndex(targets, 3, 'up', true), 2);
  assert.equal(nextFocusIndex(targets, 3, 'left', true), 3);
  assert.equal(nextFocusIndex(targets, 0, 'up', true), 0);
});

test('Nach Größenwechsel gilt die neue tatsächliche Anordnung statt fester Spalten', () => {
  const vertical = [box(0, 0), box(0, 70), box(0, 140)];

  assert.equal(nextFocusIndex(vertical, 0, 'down', true), 1);
  assert.equal(nextFocusIndex(vertical, 0, 'right', true), 0);
  assert.equal(nextFocusIndex(vertical, 1, 'down', true), 2);
});
