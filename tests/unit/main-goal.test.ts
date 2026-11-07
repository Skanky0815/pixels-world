import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MainGoal, type GoalContact } from '../../src/game/domain/main-goal.ts';
import { RoundController } from '../../src/game/domain/round-controller.ts';
import { resolveRoom } from '../../src/game/content/resolve-room.ts';
import { LIVING_ROOM } from '../../src/content/rooms/living-room.ts';
import { COZY_REMIX } from '../../src/content/rooms/cozy-remix.ts';
import { OBJECTS } from '../../src/content/objects/catalog.ts';

const definition = resolveRoom(LIVING_ROOM, OBJECTS).goal;
const contact: GoalContact = {
  x: 850,
  left: 824,
  bodyWidth: 52,
  bottom: 154,
  grounded: true,
  climbing: false,
  velocityX: 0,
};

// eslint-disable-next-line max-lines-per-function -- Die genaue Interaktionsgrenze und der terminale Zustand sichern einen einmaligen Abschluss.
test('Genau ein Ziel: kurze Interaktion ohne Punkte, Abschluss nur einmal und frischer Reset', () => {
  const goal = new MainGoal(definition);

  assert.equal(goal.snapshot().status, 'active');
  assert.equal(goal.advance(1199, contact, false), false);
  assert.equal(goal.advance(1, contact, false), true);
  goal.finish('goal');
  const reached = goal.snapshot();

  assert.equal(reached.status, 'reached');
  assert.equal(reached.progress, 1);
  assert.equal(Object.isFrozen(reached), true);
  goal.finish('timer');
  assert.equal(goal.advance(99999, contact, false), false);
  assert.deepEqual(goal.snapshot(), reached);
  assert.equal(new MainGoal(definition).snapshot().progress, 0);
});

// eslint-disable-next-line max-lines-per-function -- Unpassende Geometrie und Eingaben dürfen keine Zielinteraktion fortsetzen.
test('Nur Stillstand an der richtigen Auflage zählt; Bewegung oder Abbruch verwirft Teilfortschritt', () => {
  const goal = new MainGoal(definition);

  for (const changed of [
    { grounded: false },
    { climbing: true },
    { bottom: 468 },
    { left: 10 },
    { velocityX: 5 },
  ]) {
    goal.advance(500, contact, false);
    goal.advance(500, { ...contact, ...changed }, false);
    assert.equal(goal.snapshot().progress, 0);
  }

  goal.advance(500, contact, false);
  goal.advance(500, contact, true);
  assert.equal(goal.snapshot().progress, 0);

  for (const delta of [0, -1, NaN, Infinity]) goal.advance(delta, contact, false);
  assert.equal(goal.snapshot().progress, 0);
});

test('Timerende bewahrt nicht erreicht als eigenen Zielstatus', () => {
  const goal = new MainGoal(definition);

  goal.advance(500, contact, false);
  goal.finish('timer');
  goal.finish('goal');
  assert.equal(goal.snapshot().status, 'missed');
  assert.equal(goal.advance(9999, contact, false), false);
});

// eslint-disable-next-line max-lines-per-function -- Frühes Ziel, späterer Timer und Score-Freeze müssen auf dieselbe einmalige Phasengrenze führen.
test('Ziel vor Ablauf beendet Chaos sofort; späterer Timer kann nicht nochmals feuern', () => {
  const round = new RoundController({ minDurationMs: 10000, maxDurationMs: 10000 });

  assert.equal(round.advance(1000, 25, true, true), true);
  const finished = round.snapshot();

  assert.equal(finished.endReason, 'goal');
  assert.equal(finished.elapsedMs, 1000);
  assert.equal(finished.finalChaosScore, 25);
  assert.equal(round.advance(20000, 999, true, true), false);
  assert.deepEqual(round.snapshot(), finished);
  round.reset();
  assert.equal(round.snapshot().endReason, null);
});

test('Trigger-Rennen: Deadline gewinnt Gleichstand; Pause und späte Ziele feuern nicht doppelt', () => {
  const round = new RoundController({ minDurationMs: 1000, maxDurationMs: 1000 });

  assert.equal(round.advance(1000, 0, false, true), false);
  assert.equal(round.advance(999, 0), false);
  assert.equal(round.advance(1, 3, true, true), true);
  assert.equal(round.snapshot().endReason, 'timer');
  assert.equal(round.advance(1, 100, true, true), false);
});

// eslint-disable-next-line max-lines-per-function -- Beide vorhandenen Räume erhalten dieselbe typisierte Auflagenauflösung; ungültige Platzierung wird vor Phaser abgelehnt.
test('Zieldefinition ist konfigurierbar und auf eine reale Auflage im Raum begrenzt', () => {
  for (const room of [LIVING_ROOM, COZY_REMIX]) {
    const resolved = resolveRoom(room, OBJECTS);

    assert.equal(resolved.goal.surfaceY, 154);
    assert.equal(resolved.goal.area.x, 840);
  }

  for (const goal of [
    { ...LIVING_ROOM.goal, x: 950 },
    { ...LIVING_ROOM.goal, dwellMs: 0 },
    { ...LIVING_ROOM.goal, surfaceId: 'missing' },
    { ...LIVING_ROOM.goal, id: 'couch' },
  ]) {
    assert.throws(() => resolveRoom({ ...LIVING_ROOM, goal }, OBJECTS), /goal/);
  }
});
