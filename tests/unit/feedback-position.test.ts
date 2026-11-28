import { test } from 'node:test';
import assert from 'node:assert/strict';
import { feedbackPosition } from '../../game/play/ui/feedback-position.ts';

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
