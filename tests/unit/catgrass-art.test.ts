import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { PNG } from 'pngjs';

function art(name: string) {
  return PNG.sync.read(
    readFileSync(new URL(`../../assets/objects/catgrass/catgrass-${name}.png`, import.meta.url)),
  );
}

// Der echte PNG-Export darf oberhalb des Topfs keine schwarze Matte enthalten.
test('Katzengras hat keine schwarze Matte um die angebissenen Halme', () => {
  const image = art('bitten');

  for (let y = 0; y < 39; y++)
    for (let x = 0; x < image.width; x++) {
      const offset = (y * image.width + x) * 4;
      const [r, g, b, a] = image.data.subarray(offset, offset + 4);

      assert.ok(a < 32 || Math.max(r, g, b) > 12, `Schwarze Matte bei ${x},${y}`);
    }
});

test('Katzengras behält beim Biss Zellgröße und identische Topfpixel', () => {
  const intact = art('intact'),
    bitten = art('bitten');

  assert.deepEqual([intact.width, intact.height, bitten.width, bitten.height], [40, 60, 40, 60]);
  assert.deepEqual(intact.data.subarray(39 * 40 * 4), bitten.data.subarray(39 * 40 * 4));
  assert.notDeepEqual(intact.data, bitten.data);
});
