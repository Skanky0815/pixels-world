import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CouchScratching, COUCH_SCRATCH } from '../../src/game/interactions/couch-scratching.ts';
import { ChaosScore } from '../../src/game/domain/chaos.ts';

test('Ungültige Punktwerte werden schon beim Erzeugen des Sofamodells abgelehnt', () => {
  for (const damageValue of [-1, 0.5, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(
      () => new CouchScratching({ ...COUCH_SCRATCH, damageValue }),
      /Invalid scratch configuration/,
      `damageValue: ${damageValue}`,
    );
  }
});

test('Gültige Sofapunktwerte einschließlich null erreichen das Ledger unverändert', () => {
  for (const damageValue of [0, 7, Number.MAX_SAFE_INTEGER]) {
    const couch = new CouchScratching({ ...COUCH_SCRATCH, damageValue });
    const score = new ChaosScore();
    assert.deepEqual(couch.snapshot(), { state: 'idle', damage: 0 });
    const event = couch.update(COUCH_SCRATCH.delayMs, true);
    assert.ok(event);
    assert.equal(event.value, damageValue);
    assert.equal(score.award(`couch-scratch-${event.stage}`, event.value, event.objectId), true);
    assert.equal(score.score, damageValue);
    assert.equal(score.count, 1);
    assert.equal(score.award(`couch-scratch-${event.stage}`, event.value, event.objectId), false);
    assert.equal(score.score, damageValue);
  }
});

test('Kratzen beginnt erst nach zwei Sekunden und emittiert begrenzte Intervalle', () => {
  const couch = new CouchScratching();
  assert.equal(couch.update(1999, true), undefined);
  assert.equal(couch.snapshot().state, 'waiting');
  assert.deepEqual(couch.update(1, true), { id: '["couch","scratch",1]', objectId: 'couch', kind: 'scratch', stage: 1, value: 3 });
  assert.equal(couch.update(749, true), undefined);
  assert.equal(couch.update(1, true)?.stage, 2);
});

test('Unterbrechung setzt Wartezeit zurück und erhält vorhandenen Schaden', () => {
  const couch = new CouchScratching();
  couch.update(1900, true);
  couch.update(0, false);
  assert.equal(couch.update(100, true), undefined);
  couch.update(1900, true);
  couch.update(0, false);
  assert.deepEqual(couch.snapshot(), { state: 'idle', damage: 1 });
  assert.equal(couch.update(1999, true), undefined);
  assert.equal(couch.update(1, true)?.stage, 2);
});

test('Keine Ereignisflut nach langem Frame und kein unbegrenzter Schaden', () => {
  const couch = new CouchScratching();
  assert.equal(couch.update(10000, true)?.stage, 1);
  assert.equal(couch.update(10000, true)?.stage, 2);
  for (let i = 0; i < 20; i++) couch.update(750, true);
  assert.equal(couch.snapshot().damage, COUCH_SCRATCH.maxDamage);
  assert.equal(couch.update(750, true), undefined);
});

test('Reset entfernt Schaden und startet eine neue vollständige Wartezeit', () => {
  const couch = new CouchScratching();
  couch.update(2000, true);
  couch.reset();
  assert.deepEqual(couch.snapshot(), { state: 'idle', damage: 0 });
  assert.equal(couch.update(1999, true), undefined);
  assert.equal(couch.update(1, true)?.stage, 1);
});

test('Verzögerung, Intervall und Schadenswert sind konfigurierbar', () => {
  const couch = new CouchScratching({ delayMs: 30, damageIntervalMs: 40, maxDamage: 2, damageValue: 7 });
  assert.equal(couch.update(29, true), undefined);
  assert.equal(couch.update(1, true)?.value, 7);
  assert.equal(couch.update(39, true), undefined);
  assert.equal(couch.update(1, true)?.stage, 2);
  assert.throws(() => new CouchScratching({ ...COUCH_SCRATCH, damageIntervalMs: 0 }));
});
