import assert from 'node:assert/strict';
import { test } from 'node:test';
import { InputFrames } from '../../src/game/input/input-state.ts';

// eslint-disable-next-line max-lines-per-function -- Arrange, Aktionen und Assertions dieses Szenarios bleiben gemeinsam lesbar; keine künstliche Aufteilung des Testablaufs.
test('Ein Frame liest Eingaben und verbrauchende Flanken nur einmal', () => {
  const frames = new InputFrames();
  let reads = 0;
  const sample = () => ({
    horizontal: 1,
    vertical: 0,
    jumpPressed: ++reads === 1,
    confirmPressed: false,
    arrows: [],
    resetPressed: false,
    active: true,
  });
  const first = frames.read(10, sample);

  assert.equal(first.jumpPressed, true);
  assert.strictEqual(frames.read(10, sample), first);
  assert.equal(reads, 1);
  assert.equal(Object.isFrozen(first), true);
  assert.throws(() => Object.assign(first, { horizontal: -1 }));
  assert.equal(frames.read(11, sample).jumpPressed, false);
  assert.equal(reads, 2);
});

// eslint-disable-next-line max-lines-per-function -- Arrange, Aktionen und Assertions dieses Szenarios bleiben gemeinsam lesbar; keine künstliche Aufteilung des Testablaufs.
test('Focus-/Lebenszyklus-Cleanup verwirft den alten Snapshot auch im selben Frame', () => {
  const frames = new InputFrames();
  const held = {
    horizontal: 1,
    vertical: -1,
    jumpPressed: true,
    confirmPressed: false,
    arrows: [],
    resetPressed: true,
    active: true,
  };

  frames.read(25, () => held);
  frames.clear();
  const released = frames.read(25, () => ({
    horizontal: 0,
    vertical: 0,
    jumpPressed: false,
    confirmPressed: false,
    arrows: [],
    resetPressed: false,
    active: false,
  }));

  assert.equal(released.active, false);
  assert.equal(released.jumpPressed, false);
  assert.equal(released.resetPressed, false);
  assert.equal(released.horizontal, 0);
  assert.notStrictEqual(released, held);
});

// eslint-disable-next-line max-lines-per-function -- Ein verworfener Resume-Frame darf Flanken erhalten, aber weder alte Bewegung noch wiederholte Eingaben erzeugen.
test('Resume puffert frische Flanken genau einmal und übernimmt nur aktuelle Bewegung', () => {
  const frames = new InputFrames();
  const idle = {
    horizontal: 0,
    vertical: 0,
    jumpPressed: false,
    confirmPressed: false,
    resetPressed: false,
    arrows: [],
    active: false,
  };
  const pending = { ...idle, horizontal: 1, jumpPressed: true, confirmPressed: true, active: true };

  frames.defer(pending);
  const resumed = frames.read(2, () => idle);

  assert.equal(resumed.jumpPressed, true);
  assert.equal(resumed.confirmPressed, true);
  assert.equal(resumed.horizontal, 0);
  assert.equal(frames.read(3, () => idle).jumpPressed, false);
  frames.defer(pending);
  frames.clear();
  assert.equal(frames.read(4, () => idle).confirmPressed, false);
});
