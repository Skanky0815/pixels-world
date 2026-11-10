import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CharmPreviewMotion,
  CHARM_PREVIEW_ACTIONS,
  type CharmPreviewAction,
} from '../../src/dev/charm-preview-motion.ts';

const actions = Object.keys(CHARM_PREVIEW_ACTIONS) as CharmPreviewAction[];

// eslint-disable-next-line max-lines-per-function -- Jede Variante muss nach ihrer einmaligen Annäherung unbegrenzt und periodisch aktiv bleiben.
test('Charme-Schleifen enden nicht nach einer festen Dauer und wiederholen den Auftakt nicht', () => {
  for (const action of actions) {
    const model = new CharmPreviewMotion();
    const config = CHARM_PREVIEW_ACTIONS[action];

    model.trigger(action);
    assert.equal(model.snapshot().phase, 'approach');
    model.advance(config.approach + 65_000);
    assert.equal(model.snapshot().action, action);
    assert.equal(model.snapshot().phase, 'loop');
    const pose = model.pose();

    model.advance(config.cycle);
    assert.deepEqual(model.pose(), pose);
    assert.equal(model.snapshot().phase, 'loop');
    assert.equal(Object.isFrozen(model.snapshot()), true);
  }
});

// eslint-disable-next-line max-lines-per-function -- Wechsel, ausdrückliches Fortfahren und Abbruch starten an der gerade sichtbaren Position.
test('Neue Aktion und Fortfahren übernehmen die sichtbare Pose ohne Positionssprung', () => {
  const model = new CharmPreviewMotion();

  model.trigger('rub');
  model.advance(1950);
  const before = model.pose();

  model.trigger('headbutt');
  assert.equal(model.pose().x, before.x);
  assert.equal(model.pose().y, before.y);
  model.advance(1200);
  const contact = model.pose();

  model.release();
  assert.equal(model.pose().x, contact.x);
  assert.equal(model.pose().angle, contact.angle);
  model.advance(500);
  assert.equal(model.snapshot().phase, 'idle');
  assert.equal(model.snapshot().action, null);
  assert.equal(model.pose().x, 0);
  model.trigger('roll');
  model.advance(4000);
  model.reset();
  assert.equal(model.pose().angle, 0);
});

// eslint-disable-next-line max-lines-per-function -- Alle Aktionsvarianten teilen dieselbe statische Bewegungsalternative.
test('Reduzierte Bewegung bleibt trotz fortlaufender Schleife statisch', () => {
  for (const action of actions) {
    const model = new CharmPreviewMotion();

    model.trigger(action, true);
    const pose = model.pose(true);

    model.advance(90_000);
    assert.deepEqual(model.pose(true), pose);
    assert.equal(pose.x, 0);
    assert.equal(pose.y, 0);
    assert.equal(pose.angle, 0);
  }
});

test('Ungültige Zeit und alte Bewegung können eine zurückgesetzte Vorschau nicht reaktivieren', () => {
  const model = new CharmPreviewMotion();

  model.trigger('paw');

  for (const value of [-1, NaN, Infinity]) model.advance(value);
  assert.equal(model.snapshot().elapsed, 0);
  model.reset();
  model.advance(30_000);
  assert.equal(model.snapshot().action, null);
  assert.equal(model.pose().frame, 0);
});
