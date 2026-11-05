import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ChaosScore } from '../../src/game/domain/chaos.ts';
import { chaosEvent } from '../../src/game/domain/chaos-event.ts';
import { CouchScratching, COUCH_SCRATCH } from '../../src/game/interactions/couch-scratching.ts';
import { CurtainSliding, CURTAIN_SLIDE } from '../../src/game/interactions/curtain-sliding.ts';
import { PlantNibbling, PLANT_NIBBLE } from '../../src/game/interactions/plant-nibbling.ts';

test('Zwei Sofainstanzen zählen erste Kratzer getrennt; Wiederholung desselben Ereignisses nicht', () => {
  const score = new ChaosScore();
  const a = new CouchScratching(COUCH_SCRATCH, 'couch-a');
  const b = new CouchScratching(COUCH_SCRATCH, 'couch-b');
  const first = a.update(2000, true),
    second = b.update(2000, true);

  assert.ok(first);
  assert.ok(second);
  assert.notEqual(first.id, second.id);
  assert.equal(score.awardEvent(first), true);
  assert.equal(score.awardEvent(second), true);
  assert.equal(score.awardEvent(first), false);
  assert.equal(score.score, 6);
  assert.equal(score.count, 2);
  assert.equal(Object.isFrozen(first), true);
  a.reset();
  score.reset();
  const again = a.update(2000, true);

  assert.ok(again);
  assert.equal(again.id, first.id);
  assert.equal(score.awardEvent(again), true);
});

test('Alle Schadensarten einschließlich Vasenbruch teilen den Score-Pfad', () => {
  const curtain = new CurtainSliding(CURTAIN_SLIDE, 'curtain-b');
  const plant = new PlantNibbling(PLANT_NIBBLE, 'plant-b');
  const score = new ChaosScore();
  const tear = curtain.update(600, 'sliding', true);
  const bite = plant.update(2000, true);

  plant.update(1000, true);
  const tip = plant.update(1200, true);

  assert.ok(tear);
  assert.ok(bite);
  assert.ok(tip);

  for (const event of [tear, bite, tip, chaosEvent('vase-b', 'break', 1, 25)]) {
    assert.equal(score.awardEvent(event), true);
    assert.equal(score.awardEvent(event), false);
  }

  assert.equal(score.score, 41);
  assert.equal(score.count, 3);
});

test('Ereigniskennung unterscheidet Art/Stufe und bleibt mit Trennzeichen in Objekt-IDs eindeutig', () => {
  const ids = [
    chaosEvent('a:tear:1', 'scratch', 1, 3),
    chaosEvent('a', 'tear', 1, 4),
    chaosEvent('a', 'scratch', 1, 3),
    chaosEvent('a', 'scratch', 2, 3),
  ].map((e) => e.id);

  assert.equal(new Set(ids).size, 4);
  assert.deepEqual(JSON.parse(ids[0] ?? ''), ['a:tear:1', 'scratch', 1]);

  for (const id of ['', ' '])
    assert.throws(() => new CouchScratching(COUCH_SCRATCH, id), /Invalid object ID/);
});
