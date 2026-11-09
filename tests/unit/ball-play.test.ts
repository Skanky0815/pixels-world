import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  BallPlay,
  BALL_PLAY_DURATION,
  ballPlayPose,
  ballPlayPlacement,
} from '../../src/game/domain/ball-play.ts';

// eslint-disable-next-line max-lines-per-function -- Lebensdauer, ungültige Zeit und genau ein Abschlusssignal bilden denselben Vertrag.
test('Ballspiel startet einmal und endet nur durch gültige aktive Zeit', () => {
  const play = new BallPlay();

  assert.equal(play.advance(1000), false);
  assert.equal(play.snapshot().elapsedMs, 0);
  assert.equal(play.start(), true);
  assert.equal(play.start(), false);

  for (const delta of [0, -1, NaN, Infinity]) assert.equal(play.advance(delta), false);
  assert.equal(play.snapshot().elapsedMs, 0);
  assert.equal(play.advance(BALL_PLAY_DURATION - 1), false);
  assert.equal(play.snapshot().active, true);
  assert.equal(play.advance(100), true);
  assert.equal(play.snapshot().active, false);
  assert.equal(play.snapshot().elapsedMs, BALL_PLAY_DURATION);
  assert.equal(play.advance(100), false);
  assert.equal(play.start(), false);
});

test('Ball rollt hin und zurück; Pixel dreht zweimal und endet am ruhigen Fußanker', () => {
  assert.equal(ballPlayPose(500, false).ball, 0);
  assert.equal(ballPlayPose(1500, false).ball, 48);
  assert.equal(ballPlayPose(2200, false).ball, 24);
  assert.equal(ballPlayPose(3000, false).ball, 0);
  assert.equal(ballPlayPose(500, false).faceLeft, true);
  assert.equal(ballPlayPose(1600, false).faceLeft, false);
  assert.equal(ballPlayPose(2800, false).faceLeft, true);
  assert.equal(ballPlayPose(BALL_PLAY_DURATION, false).step, 0);
});

test('Reduzierte Bewegung unterdrückt Ballweg, Schritte und Drehungen', () => {
  for (let time = 0; time <= BALL_PLAY_DURATION; time += 50) {
    const pose = ballPlayPose(time, true);

    assert.deepEqual([pose.ball, pose.step, pose.alignment, pose.faceLeft], [0, 0, 0, true]);
    assert.ok([0, 2].includes(pose.frame));
  }
});

// eslint-disable-next-line max-lines-per-function -- Linker und rechter Fundort müssen bei jedem Frame innerhalb derselben sicheren Regalfläche bleiben.
test('Gespiegelte Fundorte begrenzen Ball und Kontaktfläche auf das Regal', () => {
  for (const ballX of [850, 910]) {
    const layout = ballPlayPlacement(ballX, 840, 920);

    for (let time = 0; time <= BALL_PLAY_DURATION; time += 10) {
      const pose = ballPlayPose(time, false);
      const ball = ballX + (layout.direction * layout.travel * pose.ball) / 48;
      const pixel = layout.anchorX + layout.direction * pose.step;

      assert.ok(ball >= 848 && ball <= 912);
      assert.ok(pixel - 26 >= 840 && pixel + 26 <= 920);
    }
  }
});
