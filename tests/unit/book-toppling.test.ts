import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BookToppling } from '../../src/game/interactions/book-toppling.ts';
import { ChaosScore } from '../../src/game/domain/chaos.ts';

test('Bücher warnen sichtbar, Weggehen setzt Kontaktzeit zurück', () => {
  const books = new BookToppling('books');

  books.update(900, true);
  assert.equal(books.snapshot().state, 'wobbling');
  books.update(100, false);
  assert.deepEqual(books.snapshot(), { state: 'stacked', progress: 0 });
  books.update(900, true);
  assert.equal(books.snapshot().state, 'wobbling');
});

// eslint-disable-next-line max-lines-per-function -- Unumkehrbarer Fall, genau ein Schaden und Reset bilden einen vollständigen Lebenszyklus.
test('Umsturz endet auch ohne Kontakt, zählt einmal und lässt sich zurücksetzen', () => {
  const books = new BookToppling('books');
  const score = new ChaosScore();

  assert.equal(books.update(1000, true), undefined);
  assert.equal(books.snapshot().state, 'falling');
  const event = books.update(450, false);

  assert.ok(event);
  score.awardEvent(event);
  score.awardEvent(event);
  assert.equal(score.score, 12);
  assert.equal(books.update(10000, true), undefined);
  assert.equal(books.snapshot().state, 'fallen');
  books.reset();
  assert.deepEqual(books.snapshot(), { state: 'stacked', progress: 0 });
});

// eslint-disable-next-line max-lines-per-function -- Ungültige Konfiguration und ungültige Framezeit prüfen die beiden Eingangsgrenzen des Modells.
test('Zeit- und Punktewerte müssen endlich und zulässig sein', () => {
  for (const rules of [
    { warningMs: 0, fallMs: 1, points: 1 },
    { warningMs: 1, fallMs: Infinity, points: 1 },
    { warningMs: 1, fallMs: 1, points: -1 },
  ])
    assert.throws(() => new BookToppling('books', rules));
  const books = new BookToppling('books');

  books.update(NaN, true);
  assert.equal(books.snapshot().progress, 0);
});
