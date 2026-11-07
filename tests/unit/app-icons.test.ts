import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { PNG } from 'pngjs';

for (const [name, size] of [
  ['favicon-32', 32],
  ['apple-touch-icon', 180],
  ['pixel-192', 192],
  ['pixel-512', 512],
  ['pixel-maskable-512', 512],
] as const) {
  test(`App-Icon ${name} besitzt die zugesagte Größe und einen deckenden Hintergrund`, () => {
    const icon = PNG.sync.read(
      readFileSync(new URL(`../../public/icons/${name}.png`, import.meta.url)),
    );

    assert.equal(icon.width, size);
    assert.equal(icon.height, size);

    for (let index = 3; index < icon.data.length; index += 4) assert.equal(icon.data[index], 255);
  });
}

// eslint-disable-next-line max-lines-per-function -- Alle sichtbaren Motivpixel müssen innerhalb des sicheren Maskierungskreises liegen.
test('Maskierbares Icon hält das gesamte Motiv im zentralen sicheren Kreis', () => {
  const icon = PNG.sync.read(
    readFileSync(new URL('../../public/icons/pixel-maskable-512.png', import.meta.url)),
  );

  for (let y = 0; y < icon.height; y++)
    for (let x = 0; x < icon.width; x++) {
      const pixel = icon.data.subarray((y * icon.width + x) * 4, (y * icon.width + x) * 4 + 3);

      if (pixel[0] === 36 && pixel[1] === 31 && pixel[2] === 41) continue;
      assert.ok(Math.hypot(x - 256, y - 256) <= 512 * 0.4, `${x},${y} würde abgeschnitten`);
    }
});
