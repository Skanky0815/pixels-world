import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { PNG } from 'pngjs';

test('Regalmodule besitzen feste Zellmaße und eine durchgehende Brettoberkante', () => {
  for (const name of ['left', 'center', 'right', 'bracket']) {
    const image = PNG.sync.read(
      readFileSync(new URL(`../../assets/objects/shelves/shelf-${name}.png`, import.meta.url)),
    );

    assert.deepEqual([image.width, image.height], name === 'bracket' ? [4, 10] : [8, 8]);

    if (name === 'bracket') continue;

    for (let x = 0; x < 8; x++) assert.ok(image.data[x * 4 + 3] >= 192);
  }
});

// eslint-disable-next-line max-lines-per-function -- Der echte Bruchpatch wird auf transparente Lücken und erhaltene deckende Holzspitzen geprüft.
test('Die Bruchkante enthält sichtbare Holzspitzen und transparente Lücken', () => {
  const image = PNG.sync.read(
    readFileSync(new URL('../../assets/objects/shelves/shelf-break.png', import.meta.url)),
  );
  const edge = Array.from(
    { length: image.height },
    (_, y) => image.data[(y * image.width + image.width - 1) * 4 + 3],
  );

  assert.deepEqual([image.width, image.height], [8, 8]);
  assert.ok(edge.some((alpha) => alpha < 128));
  assert.ok(image.data.some((value, i) => i % 4 === 3 && value >= 192));
});
