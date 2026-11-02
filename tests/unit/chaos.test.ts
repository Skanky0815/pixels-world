import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ChaosScore, angerFor, VASES } from '../../src/chaos.ts';

test('Schaden zählt pro Objekt genau einmal, unterschiedliche Objekte summieren sich', () => {
  const score = new ChaosScore();
  assert.equal(score.award('vase-a', 25), true);
  assert.equal(score.award('vase-a', 25), false);
  assert.equal(score.award('vase-a', 99), false);
  assert.equal(score.award('vase-b', 35), true);
  assert.equal(score.score, 60);
  assert.equal(score.count, 2);
});

test('Neustart setzt Punkte und Ereignishistorie zurück', () => {
  const score = new ChaosScore();
  score.award('vase', 25);
  score.reset();
  assert.equal(score.score, 0);
  assert.equal(score.count, 0);
  assert.equal(score.award('vase', 25), true);
  assert.equal(score.score, 25);
});

test('Ärgerstufen wechseln an den konfigurierten Grenzen', () => {
  for (const [points, level] of [[0, 'calm'], [24, 'calm'], [25, 'annoyed'], [59, 'annoyed'], [60, 'angry'], [100, 'angry']] as const) {
    assert.equal(angerFor(points).id, level);
  }
});

test('Ungültige Objektwerte ändern den Punktestand nicht', () => {
  const score = new ChaosScore();
  for (const points of [-1, 0.5, NaN, Infinity]) assert.throws(() => score.award('bad', points));
  assert.equal(score.score, 0);
  assert.equal(score.count, 0);
});

test('Vasenwerte erlauben alle drei Ärgerstufen', () => {
  const score = new ChaosScore();
  assert.equal(angerFor(score.score).id, 'calm');
  score.award(VASES[0].id, VASES[0].points);
  assert.equal(angerFor(score.score).id, 'annoyed');
  score.award(VASES[1].id, VASES[1].points);
  assert.equal(angerFor(score.score).id, 'angry');
  assert.equal(new Set(VASES.map(v => v.id)).size, VASES.length);
});
