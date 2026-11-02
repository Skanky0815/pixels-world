import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PLANT_NIBBLE, PlantNibbling } from '../../src/plant-nibbling.ts';

test('Nähe und Stillstand lösen erst nach voller Wartezeit Knabbern aus', () => {
  const plant = new PlantNibbling();
  plant.update(9000, false);
  assert.equal(plant.snapshot().state, 'idle');
  assert.equal(plant.update(1999, true), undefined);
  const event = plant.update(1, true);
  assert.deepEqual(event, { objectId: 'plant', kind: 'nibble', stage: 1, value: 2 });
  assert.equal(Object.isFrozen(event), true);
  assert.equal(plant.snapshot().state, 'nibbling');
});

test('Topf kippt erst nach Knabberphase und vollständiger Wackelwarnung', () => {
  const plant = new PlantNibbling();
  plant.update(2000, true);
  plant.update(999, true);
  assert.equal(plant.snapshot().state, 'nibbling');
  plant.update(1, true);
  assert.equal(plant.snapshot().state, 'wobbling');
  assert.equal(plant.update(1199, true), undefined);
  assert.deepEqual(plant.update(1, true), { objectId: 'plant', kind: 'tip', stage: 2, value: 10 });
  assert.equal(plant.snapshot().state, 'tipped');
});

test('Abbruch in jeder aktiven Phase setzt die Zeit zurück, vorhandener Biss zählt nicht erneut', () => {
  for (const advances of [[1900], [2000, 500], [2000, 1000, 1100]]) {
    const plant = new PlantNibbling();
    for (const ms of advances) plant.update(ms, true);
    const damage = plant.snapshot().damage;
    plant.update(16, false);
    assert.deepEqual(plant.snapshot(), { state: 'idle', damage, progress: 0 });
    assert.equal(plant.update(1999, true), undefined);
    assert.equal(plant.snapshot().state, 'waiting');
    const event = plant.update(1, true);
    assert.equal(event?.kind, damage ? undefined : 'nibble');
    assert.equal(plant.snapshot().state, 'nibbling');
  }
});

test('Langframes überspringen keine Warnphase und gekippter Topf erzeugt keine weiteren Ereignisse', () => {
  const plant = new PlantNibbling();
  assert.equal(plant.update(100000, true)?.kind, 'nibble');
  assert.equal(plant.update(100000, true), undefined);
  assert.equal(plant.snapshot().state, 'wobbling');
  assert.equal(plant.update(1200, true)?.kind, 'tip');
  assert.equal(plant.update(100000, false), undefined);
  assert.equal(plant.update(100000, true), undefined);
  assert.equal(plant.snapshot().damage, 2);
});

test('Reset stellt Pflanze und beide einmaligen Schadensstufen wieder her', () => {
  const plant = new PlantNibbling();
  plant.update(2000, true); plant.update(1000, true); plant.update(1200, true);
  plant.reset();
  assert.deepEqual(plant.snapshot(), { state: 'idle', damage: 0, progress: 0 });
  assert.equal(plant.update(2000, true)?.stage, 1);
});

test('Wartezeiten und Werte sind konfigurierbar; ungültige Zeit zählt nicht', () => {
  const plant = new PlantNibbling({ delayMs: 20, nibbleMs: 30, warningMs: 40, nibbleValue: 3, tipValue: 7 });
  for (const delta of [-100, NaN, Infinity]) assert.equal(plant.update(delta, true), undefined);
  assert.equal(plant.update(20, true)?.value, 3);
  plant.update(30, true);
  assert.equal(plant.update(40, true)?.value, 7);
  assert.throws(() => new PlantNibbling({ ...PLANT_NIBBLE, warningMs: 0 }));
  assert.throws(() => new PlantNibbling({ ...PLANT_NIBBLE, tipValue: -1 }));
});
