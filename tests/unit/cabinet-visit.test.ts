/* eslint-disable max-lines-per-function -- Die zusammenhängenden Türphasen werden für eine zweite Möbelkonfiguration und jeden Abbruchzustand geprüft. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CabinetVisit, CABINET_VISIT_RULES } from '../../src/game/interactions/cabinet-visit.ts';

test('Gemeinsamer Schrankablauf braucht Griffkontakt und verwendet die Zeiten und Punkte des Möbels', () => {
  const cabinet = new CabinetVisit('wardrobe', {
    ...CABINET_VISIT_RULES,
    hangingMs: 200,
    openingMs: 300,
    enteringMs: 100,
    insideMs: 700,
    reopeningMs: 200,
    points: 12,
  });

  jump(cabinet, false);
  assert.equal(cabinet.snapshot().bumps, 1);
  jump(cabinet, false);
  assert.equal(cabinet.snapshot().captured, false);
  assert.equal(cabinet.snapshot().bumps, 1);
  jump(cabinet, true);
  assert.equal(cabinet.snapshot().state, 'hanging');
  assert.equal(cabinet.snapshot().hidden, false);
  cabinet.update(200);
  assert.equal(cabinet.snapshot().state, 'opening');
  cabinet.update(150);
  assert.equal(cabinet.snapshot().doorState, 'ajar');
  assert.equal(cabinet.snapshot().hidden, false);
  cabinet.update(150);
  assert.equal(cabinet.snapshot().hidden, true);
  cabinet.update(100);
  assert.equal(cabinet.snapshot().doorState, 'closed');
  assert.equal(cabinet.update(700), undefined);
  assert.equal(cabinet.snapshot().doorState, 'ajar');
  assert.equal(cabinet.snapshot().hidden, true);
  assert.equal(cabinet.update(200)?.value, 12);
  assert.equal(cabinet.snapshot().captured, false);
});

function jump(cabinet: CabinetVisit, handle: boolean) {
  cabinet.observeJump(true, true, false);
  cabinet.observeJump(false, false, true, false, handle);
}

test('Verzögerter Bodenkontakt nach dem Absprung verwirft den Sprung vor Erreichen der Klinke nicht', () => {
  const cabinet = new CabinetVisit('cabinet');

  for (const count of [1, 2]) {
    cabinet.observeJump(true, true, false, false, false, true);
    cabinet.observeJump(false, true, false, false, false, true);
    cabinet.observeJump(false, false, false, false, false, true);
    assert.equal(cabinet.observeJump(false, false, true, false, true, true), count);

    if (count === 1) cabinet.observeJump(false, true, false);
  }

  assert.equal(cabinet.snapshot().state, 'hanging');
});

test('Reset gibt jede Aufnahmephase frei; inaktive Zeit und Fremdtreffer überspringen das Festhalten nicht', () => {
  for (const steps of [[], [600], [600, 400], [600, 400, 200], [600, 400, 200, 1400]]) {
    const cabinet = new CabinetVisit('cabinet');

    jump(cabinet, false);
    jump(cabinet, true);

    for (const step of steps) cabinet.update(step);
    const before = cabinet.snapshot();

    cabinet.update(NaN);
    cabinet.update(-100);
    cabinet.update(0);
    assert.equal(cabinet.disturb(), undefined);
    assert.deepEqual(cabinet.snapshot(), before);
    cabinet.reset();
    assert.equal(cabinet.snapshot().captured, false);
    assert.equal(cabinet.snapshot().hidden, false);
    assert.equal(cabinet.snapshot().state, 'idle');
  }
});
