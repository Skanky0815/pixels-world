import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ChaosScore, angerFor, VASES } from '../../src/game/domain/chaos.ts';

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


test('Mehrere Schadensstufen zählen Punkte einzeln, das Objekt aber nur einmal', () => {
  const score = new ChaosScore();
  for (let stage = 1; stage <= 6; stage++) {
    assert.equal(score.award(`couch-${stage}`, 3, 'couch'), true);
    assert.equal(score.award(`couch-${stage}`, 3, 'couch'), false);
  }
  assert.equal(score.score, 18);
  assert.equal(score.count, 1);
  score.award('vase', 25);
  assert.equal(score.score, 43);
  assert.equal(score.count, 2);
  score.reset();
  assert.equal(score.count, 0);
  assert.equal(score.award('couch-1', 3, 'couch'), true);
  assert.equal(score.score, 3);
});
