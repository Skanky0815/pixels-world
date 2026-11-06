import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PreviewPlayback } from '../../src/dev/preview-playback.ts';

const clip = { frames: [10, 11, 12], frameRate: 10 };

test('Vorschau begrenzt Zeitsprünge und ignoriert negative Deltas', () => {
  const clock = new PreviewPlayback();

  clock.advance(100);
  assert.equal(clock.frame(clip), 11);
  clock.advance(-100);
  assert.equal(clock.frame(clip), 11);
  clock.advance(5000);
  assert.equal(clock.frame(clip), 12);
});

// eslint-disable-next-line max-lines-per-function -- Zwei unabhängige Uhren werden über dieselben Zeitintervalle verglichen.
test('Einzelpause und globale Pause bleiben unabhängig', () => {
  const pixel = new PreviewPlayback();
  const sara = new PreviewPlayback();

  pixel.toggle();
  pixel.advance(100);
  sara.advance(100);
  assert.equal(pixel.frame(clip), 10);
  assert.equal(sara.frame(clip), 11);
  sara.setGlobalPaused(true);
  sara.advance(100);
  assert.equal(sara.frame(clip), 11);
  pixel.setGlobalPaused(true);
  pixel.setGlobalPaused(false);
  pixel.advance(100);
  assert.equal(pixel.frame(clip), 10);
});

// eslint-disable-next-line max-lines-per-function -- Einzelbild und Auswahlwechsel müssen die bestehende Pause erhalten.
test('Einzelschritt läuft um und Auswahlwechsel setzt nur den Frame zurück', () => {
  const clock = new PreviewPlayback();

  clock.toggle();
  clock.step();
  assert.equal(clock.frame(clip), 11);
  clock.step();
  clock.step();
  assert.equal(clock.frame(clip), 10);
  clock.step();
  clock.reset();
  clock.advance(100);
  assert.equal(clock.frame(clip), 10);
  assert.equal(clock.paused, true);
  clock.setGlobalPaused(true);
  clock.reset();
  assert.equal(clock.canStep, true);
});
