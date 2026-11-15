import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  homecomingPositions,
  homecomingCharmPose,
  homecomingPanel,
} from '../../game/play/content/homecoming-layout.ts';
import { CharmMotion } from '../../game/play/domain/charm-motion.ts';

test('Dialog und Versöhnung nutzen die freie Seite gegenüber Saras Eintritt', () => {
  for (const width of [960, 1320]) {
    const left = homecomingPanel(width, 'right');
    const right = homecomingPanel(width, 'left');

    assert.equal(left.left, 40);
    assert.equal(right.right, width - 40);
    assert.ok(left.right < homecomingPositions(width).pixelSeatX - 40);
    assert.ok(right.left > homecomingPositions(width, 'left').pixelSeatX + 40);
  }
});

test('Linker Auftritt lässt Sara und Pixel mit gleichem Abstand auf freiem Boden zusammentreffen', () => {
  assert.deepEqual(homecomingPositions(960), { saraStartX: 992, saraEndX: 846, pixelSeatX: 782 });
  assert.deepEqual(homecomingPositions(960, 'left'), {
    saraStartX: -32,
    saraEndX: 114,
    pixelSeatX: 178,
  });
  const left = homecomingPositions(1100, 'left');

  assert.equal(left.pixelSeatX - left.saraEndX, 64);
});

// eslint-disable-next-line max-lines-per-function -- Gespiegelte Pose, Bildidentität und unveränderte Eingabe werden gemeinsam geprüft.
test('Linke Charmeposen spiegeln Annäherung und Blickrichtung, ohne die Ursprungspose zu verändern', () => {
  const motion = new CharmMotion();

  motion.trigger('rub');
  motion.advance(800);
  const pose = motion.pose();
  const before = { ...pose };
  const left = homecomingCharmPose(pose, 'left');

  assert.equal(left.x, -pose.x);
  assert.equal(left.faceLeft, !pose.faceLeft);
  assert.equal(left.sheet, pose.sheet);
  assert.equal(left.frame, pose.frame);
  assert.deepEqual(pose, before);
  assert.equal(homecomingCharmPose(pose), pose);
});
