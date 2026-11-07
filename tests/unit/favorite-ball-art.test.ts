import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { PNG } from 'pngjs';

// Der echte Ball-Export behält Zellgröße und vollständig transparenten Außenrand.
test('Lieblingsball hat eine 16×16-Zelle mit freiem Alpha-Rand', () => {
  const image = PNG.sync.read(
    readFileSync(new URL('../../assets/objects/favorite-ball/favorite-ball.png', import.meta.url)),
  );

  assert.deepEqual([image.width, image.height], [16, 16]);

  for (let i = 0; i < 16; i++)
    for (const offset of [i, 240 + i, i * 16, i * 16 + 15])
      assert.equal(image.data[offset * 4 + 3], 0);
  assert.ok(image.data.some((value, index) => index % 4 === 3 && value > 192));
});
