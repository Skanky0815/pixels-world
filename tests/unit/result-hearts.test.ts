import { test } from 'node:test';
import assert from 'node:assert/strict';
import { drawResultHearts } from '../../src/game/ui/result-hearts.ts';
import type Phaser from 'phaser';

// eslint-disable-next-line max-lines-per-function -- Alle unterstützten Anzahlen und Teilfortschritte müssen dieselben Konturen behalten.
test('Ergebnisherzen behalten Kontur, Grundlinie und Abstand bei jedem Fortschritt', () => {
  for (const required of [1, 2, 3, 4]) {
    let baseline: unknown;

    for (let earned = 0; earned <= required; earned++) {
      const strokes: unknown[] = [];
      const fills: unknown[] = [];
      const graphics = {
        clear() {
          return this;
        },
        lineStyle() {
          return this;
        },
        fillStyle() {
          return this;
        },
        fillPoints(points: unknown) {
          fills.push(points);
        },
        strokePoints(points: unknown) {
          strokes.push(points);
        },
      };

      drawResultHearts(graphics as unknown as Phaser.GameObjects.Graphics, earned, required, 0);
      baseline ??= strokes;
      assert.deepEqual(strokes, baseline);
      assert.equal(strokes.length, required);
      assert.deepEqual(fills, strokes.slice(0, earned));
    }
  }
});
