/* eslint-disable max-lines-per-function -- Abschlussauswahl, Endpose und Bewegungspräferenz werden als unabhängige sichtbare Verträge geprüft. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EndingPresentation } from '../../src/game/domain/ending-presentation.ts';
import { readFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import { CharmMotion } from '../../src/game/domain/charm-motion.ts';

const seated = () => new CharmMotion().pose();

function lying() {
  const motion = new CharmMotion();

  motion.trigger('roll');
  motion.advance(1800);

  return motion.pose();
}

test('Ohne finales Ergebnis beginnt keine Abschlussanimation', () => {
  const ending = new EndingPresentation();

  ending.update(null, lying(), 10000);
  assert.equal(ending.pose(), null);
  assert.equal(ending.snapshot().kind, null);
});

test('Erfolg wählt Kopf oder Bauch nach Pixels tatsächlicher Haltung', () => {
  const head = new EndingPresentation();
  const belly = new EndingPresentation();

  head.update({ outcome: 'success' }, seated(), 32);
  belly.update({ outcome: 'success' }, lying(), 32);
  assert.equal(head.pose()?.kind, 'head');
  assert.equal(belly.pose()?.kind, 'belly');
  assert.equal(head.pose()?.frame, 6);
  assert.equal(belly.pose()?.frame, 0);
  assert.equal(head.pose()?.approach, 0);
});

test('Scheitern bleibt sauer, auch wenn Pixel auf dem Rücken liegt', () => {
  const ending = new EndingPresentation();
  const pixel = lying();

  ending.update({ outcome: 'failed' }, pixel, 0);
  assert.equal(ending.pose()?.kind, 'sulk');
  assert.equal(ending.pixelPose(pixel), pixel);
});

test('Clip hält die Endpose, beginnt nicht neu und ignoriert ungültige oder pausierte Zeit', () => {
  const ending = new EndingPresentation();

  ending.update({ outcome: 'success' }, lying(), 0);
  ending.update({ outcome: 'success' }, seated(), 1000);
  assert.equal(ending.pose()?.kind, 'belly');
  const paused = ending.snapshot();

  for (const delta of [0, -1, Infinity, NaN])
    ending.update({ outcome: 'success' }, seated(), delta);
  assert.deepEqual(ending.snapshot(), paused);
  ending.update({ outcome: 'success' }, seated(), 10000);
  assert.equal(ending.pose()?.frame, 5);
  assert.equal(ending.snapshot().complete, true);
  ending.update({ outcome: 'success' }, seated(), 10000);
  assert.equal(ending.pose()?.frame, 5);
});

test('Ruhige Endpose behält Pixels Anker und legt Saras Hand sichtbar vor ihn', () => {
  const ending = new EndingPresentation();
  const pixel = lying();

  ending.update({ outcome: 'success' }, pixel, 0);
  assert.equal(ending.pose(true)?.frame, 5);
  assert.equal(ending.pose(true)?.approach, 1);
  const reducedPixel = { ...pixel, x: 0, frame: 8 };
  const displayed = ending.pixelPose(reducedPixel);

  assert.equal(displayed.x, pixel.x);
  assert.equal(displayed.frame, reducedPixel.frame);
  assert.equal(displayed.behindSara, true);
  assert.equal(new EndingPresentation().pose(), null);
});

test('Jede Abschlussgruppe startet mit dem vollständigen unveränderten Idle ohne Nachbarzelle', () => {
  const idle = PNG.sync.read(
    readFileSync(new URL('../../assets/sara/sara-sheet-v1.png', import.meta.url)),
  );
  const sheet = PNG.sync.read(
    readFileSync(new URL('../../assets/sara/ending-v1/ending-sheet-v1.png', import.meta.url)),
  );
  const expected = Buffer.alloc(96 * 96 * 4);

  for (let y = 0; y < 96; y++)
    idle.data.copy(expected, (y * 96 + 16) * 4, y * idle.width * 4, (y * idle.width + 64) * 4);

  for (const row of [0, 1, 2]) {
    const actual = Buffer.alloc(96 * 96 * 4);

    for (let y = 0; y < 96; y++)
      sheet.data.copy(
        actual,
        y * 96 * 4,
        (row * 96 + y) * sheet.width * 4,
        ((row * 96 + y) * sheet.width + 96) * 4,
      );
    assert.deepEqual(actual, expected);
  }
});
