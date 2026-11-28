import { test } from 'node:test';
import assert from 'node:assert/strict';
import { feedbackPosition, feedbackOverlap } from '../../game/play/ui/feedback-position.ts';

// eslint-disable-next-line max-lines-per-function -- Zwei Ankerpositionen vergleichen oberhalb und unterhalb derselben Figur.
test('Pixelmeldung folgt dem Anker und weicht am oberen Rand unter die Figur aus', () => {
  const message = { width: 180, height: 42 };
  const canvas = { width: 960, height: 540 };

  assert.deepEqual(feedbackPosition({ x: 400, top: 200, bottom: 264 }, message, canvas, 8), {
    left: 310,
    top: 146,
  });
  assert.deepEqual(feedbackPosition({ x: 400, top: 20, bottom: 84 }, message, canvas, 8), {
    left: 310,
    top: 96,
  });
});

// eslint-disable-next-line max-lines-per-function -- Alle vier Ränder und schmale/weite Meldungen prüfen dieselbe sichtbare Canvas-Grenze.
test('Lange Meldungen bleiben an allen Canvasrändern einschließlich Hub vollständig lesbar', () => {
  const canvas = { width: 320, height: 180 };

  for (const width of [90, 280]) {
    for (const x of [-20, 160, 340]) {
      for (const top of [-30, 80, 190]) {
        const position = feedbackPosition(
          { x, top, bottom: top + 64 },
          { width, height: 48 },
          canvas,
          8,
        );

        assert.ok(position.left >= 8);
        assert.ok(position.left + width <= canvas.width - 8);
        assert.ok(position.top - 8 >= 8);
        assert.ok(position.top + 48 <= canvas.height - 8);
      }
    }
  }
});

// eslint-disable-next-line max-lines-per-function -- Die Rechtecke bilden echte HUD-, Banner- und Touchregionen in einem flachen Fenster nach.
test('Schadensstapel weicht dynamischen Bannern und Touchflächen aus', () => {
  const canvas = { width: 568, height: 236 };
  const message = { width: 180, height: 90 };
  const obstacles = [
    { left: 8, top: 140, width: 150, height: 88 },
    { left: 472, top: 140, width: 88, height: 88 },
    { left: 360, top: 70, width: 200, height: 60 },
    { left: 390, top: 8, width: 170, height: 50 },
  ];
  const position = feedbackPosition(
    { x: 500, top: 100, bottom: 160 },
    message,
    canvas,
    8,
    obstacles,
  );

  assert.equal(feedbackOverlap(position, message, obstacles, 8), 0);
  assert.ok(position.left >= 8 && position.left + message.width <= canvas.width - 8);
  assert.ok(position.top >= 16 && position.top + message.height <= canvas.height - 8);
});
