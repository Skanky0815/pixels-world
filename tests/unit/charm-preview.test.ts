import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import {
  CharmMotion,
  CHARM_ACTIONS,
  type CharmAction,
} from '../../src/game/domain/charm-motion.ts';

const actions = Object.keys(CHARM_ACTIONS) as CharmAction[];

// eslint-disable-next-line max-lines-per-function -- Eine volle Runde prüft an beiden Seiten der Wendepunkte Laufrichtung und räumliche Reihenfolge gemeinsam.
test('Umstreichen läuft nach rechts vor Sara und nach links hinter ihr', () => {
  const model = new CharmMotion();

  model.trigger('rub');
  model.advance(CHARM_ACTIONS.rub.approach + 50);

  for (let index = 0; index < 28; index++) {
    const before = model.pose();

    model.advance(1);
    const movingLeft = model.pose().x < before.x;

    assert.equal(before.behindSara, movingLeft);
    assert.equal(before.faceLeft, movingLeft);
    model.advance(99);
  }
});

// eslint-disable-next-line max-lines-per-function -- Jede Variante muss nach ihrer einmaligen Annäherung unbegrenzt und periodisch aktiv bleiben.
test('Charme-Schleifen enden nicht nach einer festen Dauer und wiederholen den Auftakt nicht', () => {
  for (const action of actions) {
    const model = new CharmMotion();
    const config = CHARM_ACTIONS[action];

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
  const model = new CharmMotion();

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
    const model = new CharmMotion();

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
  const model = new CharmMotion();

  model.trigger('paw');

  for (const value of [-1, NaN, Infinity]) model.advance(value);
  assert.equal(model.snapshot().elapsed, 0);
  model.reset();
  model.advance(30_000);
  assert.equal(model.snapshot().action, null);
  assert.equal(model.pose().frame, 0);
});

// eslint-disable-next-line max-lines-per-function -- Beide neuen Animationen müssen echte Atlas-Frames statt gedrehter oder gestreckter Sitzbilder verwenden.
test('Kopf und Bauch verwenden eigene Frames mit ruhender Bildausrichtung', () => {
  const head = new CharmMotion();

  head.trigger('headbutt');
  head.advance(800);
  const frames = new Set<number>();

  for (let index = 0; index < 8; index++) {
    const pose = head.pose();

    assert.equal(pose.sheet, 'charm');
    assert.equal(pose.cell, 48);
    assert.equal(pose.angle, 0);
    frames.add(pose.frame);
    head.advance(225);
  }

  assert.ok(frames.size >= 4);
  const belly = new CharmMotion();

  belly.trigger('roll');
  belly.advance(700);
  assert.equal(belly.pose().frame, 6);
  belly.advance(300);
  assert.equal(belly.pose().frame, 7);
  belly.advance(600);
  assert.equal(belly.pose().sheet, 'charm');
  assert.equal(belly.pose().angle, 0);
  assert.ok(belly.pose().frame >= 8);
  belly.release();
  belly.advance(220);
  assert.equal(belly.pose().frame, 7);
  belly.advance(220);
  assert.equal(belly.pose().frame, 6);
  belly.advance(660);
  assert.equal(belly.snapshot().phase, 'idle');
});

// eslint-disable-next-line max-lines-per-function -- Alle zwölf gelieferten Zeichnungen müssen vollständig, transparent gerahmt und am gemeinsamen Bodenanker lesbar bleiben.
test('Charme-Atlas enthält zwölf vollständige 48er-Zellen ohne abgeschnittene Pfoten', () => {
  const sheet = PNG.sync.read(
    readFileSync(new URL('../../assets/pixel/charm-v1/charm-sheet-v1.png', import.meta.url)),
  );

  assert.deepEqual([sheet.width, sheet.height], [288, 96]);

  for (let frame = 0; frame < 12; frame++) {
    let pixels = 0;
    let bottom = 0;

    for (let offset = 0; offset < 48 * 48; offset++) {
      const x = offset % 48,
        y = Math.floor(offset / 48);
      const index = ((Math.floor(frame / 6) * 48 + y) * sheet.width + (frame % 6) * 48 + x) * 4;

      if (sheet.data[index + 3] <= 32) continue;
      pixels++;
      bottom = Math.max(bottom, y);
      assert.ok(x >= 3 && x <= 44);
    }

    assert.ok(pixels >= 150);
    assert.equal(bottom, 46);
  }
});
