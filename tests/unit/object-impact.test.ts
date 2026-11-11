import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BookToppling, BOOK_TOPPLE } from '../../src/game/interactions/book-toppling.ts';
import { ChaosScore } from '../../src/game/domain/chaos.ts';

// eslint-disable-next-line max-lines-per-function -- Ein Stoß startet den regulären Fall; wiederholter Kontakt darf ihn weder verlängern noch zusätzliche Punkte erzeugen.
test('Vasenstoß startet einen unumkehrbaren Bücherfall und zählt genau einmal', () => {
  const stack = new BookToppling('books');
  const score = new ChaosScore();

  assert.equal(stack.knockOver(), true);
  stack.update(200, false);
  assert.equal(stack.knockOver(), false);
  assert.equal(stack.update(BOOK_TOPPLE.fallMs - 201, false), undefined);
  const event = stack.update(1, false);

  assert.ok(event);
  assert.equal(score.awardEvent(event), true);
  assert.equal(stack.knockOver(), false);
  assert.equal(stack.update(10_000, false), undefined);
  assert.equal(score.score, BOOK_TOPPLE.points);
  assert.equal(score.awardEvent(event), false);
  stack.reset();
  assert.equal(stack.snapshot().state, 'stacked');
  assert.equal(stack.knockOver(), true);
});

test('Ein Vasenstoß übernimmt auch einen bereits wackelnden Stapel', () => {
  const stack = new BookToppling('books');

  stack.update(BOOK_TOPPLE.warningMs / 2, true);
  assert.equal(stack.snapshot().state, 'wobbling');
  assert.equal(stack.knockOver(), true);
  assert.deepEqual(stack.snapshot(), { state: 'falling', progress: 0 });
});
