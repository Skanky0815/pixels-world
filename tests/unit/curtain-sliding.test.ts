import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CURTAIN_SLIDE, CurtainSliding } from '../../src/game/interactions/curtain-sliding.ts';

test('Risse nur beim tatsächlichen Rutschen und erst nach dem Intervall', () => {
  const curtain = new CurtainSliding();

  assert.equal(curtain.update(2000, 'climbing', false), undefined);
  assert.equal(curtain.update(2000, 'sliding', false), undefined);
  assert.equal(curtain.update(599, 'sliding', true), undefined);
  assert.deepEqual(curtain.update(1, 'sliding', true), {
    id: '["curtain","tear",1]',
    objectId: 'curtain',
    kind: 'tear',
    stage: 1,
    value: 4,
  });
});

test('Weiterklettern und Ablösen unterbrechen das laufende Rissintervall', () => {
  const curtain = new CurtainSliding();

  curtain.update(550, 'sliding', true);
  curtain.update(16, 'climbing', false);
  assert.equal(curtain.update(550, 'sliding', true), undefined);
  curtain.update(16, 'detached', false);
  assert.equal(curtain.update(599, 'sliding', true), undefined);
  assert.equal(curtain.update(1, 'sliding', true)?.stage, 1);
  curtain.update(16, 'detached', false);
  assert.deepEqual(curtain.snapshot(), { state: 'detached', damage: 1 });
});

test('Langframes erzeugen keine Ereignisflut und Schaden ist gedeckelt', () => {
  const curtain = new CurtainSliding();

  assert.equal(curtain.update(10000, 'sliding', true)?.stage, 1);

  for (let i = 0; i < 20; i++) curtain.update(600, 'sliding', true);
  assert.equal(curtain.snapshot().damage, 8);
  assert.equal(curtain.update(600, 'sliding', true), undefined);
});

test('Reset entfernt Risse und startet ein vollständiges neues Intervall', () => {
  const curtain = new CurtainSliding();

  curtain.update(600, 'sliding', true);
  curtain.reset();
  assert.deepEqual(curtain.snapshot(), { state: 'detached', damage: 0 });
  assert.equal(curtain.update(599, 'sliding', true), undefined);
  assert.equal(curtain.update(1, 'sliding', true)?.stage, 1);
});

test('Rissintervall und Ereigniswerte sind konfigurierbar', () => {
  const curtain = new CurtainSliding({ damageIntervalMs: 30, maxDamage: 2, damageValue: 5 });

  assert.equal(curtain.update(30, 'sliding', true)?.value, 5);
  assert.equal(curtain.update(30, 'sliding', true)?.stage, 2);
  assert.equal(curtain.update(30, 'sliding', true), undefined);
  assert.throws(() => new CurtainSliding({ ...CURTAIN_SLIDE, damageIntervalMs: 0 }));
});

test('Renderframe ohne Physikbewegung pausiert das Intervall, statt es zu löschen', () => {
  const curtain = new CurtainSliding();

  curtain.update(599, 'sliding', true);
  assert.equal(curtain.update(5000, 'sliding', false), undefined);
  assert.equal(curtain.update(1, 'sliding', true)?.stage, 1);
});
