/* eslint-disable max-lines-per-function -- Die einzelnen Verträge prüfen aktiven Ablauf, sichere Platzierung und die Darstellung gemeinsam. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  FoodEating,
  FOOD_EATING_DURATION,
  foodEatingPose,
  foodEatingPlacement,
} from '../../src/game/domain/food-eating.ts';

test('Fressen startet einmal, verwendet nur aktive Zeit und endet genau einmal', () => {
  const model = new FoodEating();

  assert.equal(model.advance(1000), false);
  assert.equal(model.start(), true);
  assert.equal(model.start(), false);

  for (const delta of [0, -1, NaN, Infinity]) model.advance(delta);
  assert.equal(model.snapshot().elapsedMs, 0);
  model.advance(800);
  assert.equal(model.snapshot().phase, 'eat');
  assert.equal(model.advance(FOOD_EATING_DURATION - 801), false);
  assert.equal(model.advance(10_000), true);
  assert.equal(model.snapshot().elapsedMs, FOOD_EATING_DURATION);
  assert.equal(model.snapshot().active, false);
  assert.equal(model.advance(1), false);
  assert.equal(new FoodEating().snapshot().active, false);
});

test('Kopf absenken, zwei Knabberbilder und Aufrichten behalten einen festen Pfotenanker', () => {
  assert.equal(foodEatingPose(400, false).frame, 13);
  assert.deepEqual(
    new Set([foodEatingPose(900, false).frame, foodEatingPose(1080, false).frame]),
    new Set([23, 24]),
  );
  assert.equal(foodEatingPose(3200, false).frame, 2);
  assert.equal(foodEatingPose(200, false).alignment, 0.5);

  for (let time = 800; time < 3200; time += 90) {
    assert.equal(foodEatingPose(time, true).frame, 23);
    assert.equal(foodEatingPose(time, true).alignment, 1);
  }

  assert.equal(foodEatingPose(0, true).frame, 0);
});

test('Napf bleibt stationär; Pixel passt links und rechts auf die tatsächliche Auflage', () => {
  assert.deepEqual(foodEatingPlacement(860, 620, 960), { anchorX: 835, faceLeft: false });

  for (const bowlX of [638, 670, 860, 942]) {
    const pose = foodEatingPlacement(bowlX, 620, 960);

    assert.ok(pose.anchorX >= 650 && pose.anchorX <= 930);
    assert.equal(pose.faceLeft, pose.anchorX > bowlX);
  }
});
