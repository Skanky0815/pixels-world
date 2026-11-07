import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import {
  curtainTearPosition,
  curtainTearSize,
  type TearMark,
} from '../../src/game/objects/curtain-tear-position.ts';

function art(name: string) {
  return PNG.sync.read(
    readFileSync(new URL(`../../assets/objects/curtain/curtain-${name}.png`, import.meta.url)),
  );
}

// eslint-disable-next-line max-lines-per-function -- Beide tatsächlichen Exportdateien werden gemeinsam auf Zellmaße und Alpha geprüft.
test('Vorhang und Risspatch besitzen ihre transparenten Exportzellen', () => {
  for (const [name, width, height] of [
    ['rust', 56, 178],
    ['tear', 12, 20],
  ] as const) {
    const image = art(name);
    const alpha = [...image.data].filter((_, index) => index % 4 === 3);

    assert.deepEqual([image.width, image.height], [width, height]);
    assert.ok(alpha.includes(0) && alpha.some((value) => value > 0));
  }
});

// eslint-disable-next-line max-lines-per-function -- Acht wiederholte Kontakte an allen Rändern sichern freie, vollständige Patchpositionen statt Stapeln oder Überschreiten der Kletterfläche.
test('Acht Vorhangrisse bleiben getrennt innerhalb der Fläche', () => {
  const area = { x: 120, y: 80, width: 112, height: 356 };
  const size = curtainTearSize(area);

  for (const [x, y] of [
    [0, 0],
    [300, 600],
    [160, 210],
  ]) {
    const marks: TearMark[] = [];

    for (let stage = 0; stage < 8; stage++) {
      const mark = curtainTearPosition(area, x, y, marks);

      assert.ok(mark);
      assert.ok(
        mark.x - size.width / 2 >= area.x && mark.x + size.width / 2 <= area.x + area.width,
      );
      assert.ok(mark.y >= area.y && mark.y + size.height <= area.y + area.height);
      assert.ok(
        marks.every(
          (other) =>
            Math.abs(other.x - mark.x) >= size.width || Math.abs(other.y - mark.y) >= size.height,
        ),
      );
      marks.push(mark);
    }
  }
});

test('Kleine eigene Vorhänge begrenzen die Grafik auf ihre bestehenden Bounds', () => {
  const area = { x: 0, y: 0, width: 16, height: 42 };

  assert.deepEqual(curtainTearSize(area), { width: 16, height: 40 });
  const mark = curtainTearPosition(area, 0, 0, []);

  assert.deepEqual(mark, { x: 8, y: 0 });
  assert.equal(curtainTearPosition(area, 0, 0, [mark]), undefined);
});
