import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { PNG } from 'pngjs';

// eslint-disable-next-line max-lines-per-function -- Tatsächliche PNGs sichern zwei verschiedene Intaktsilhouetten und einen transparenten, gleich verankerten Streuzustand.
test('Buch-PNGs besitzen transparente Spielzellen und unterschiedliche Silhouetten', () => {
  const masks = new Set<string>();

  for (const [name, width, height] of [
    ['stacked', 48, 36],
    ['upright', 48, 36],
    ['fallen', 96, 24],
  ] as const) {
    const png = PNG.sync.read(
      readFileSync(new URL(`../../assets/objects/books/books-${name}.png`, import.meta.url)),
    );
    const alpha = [...png.data].filter((_, index) => index % 4 === 3);

    assert.deepEqual([png.width, png.height], [width, height]);
    assert.ok(alpha.some((value) => value === 0));
    assert.ok(alpha.slice(-width).some((value) => value > 0));
    assert.equal(alpha[0], 0);
    masks.add(alpha.map((value) => (value > 0 ? '1' : '0')).join(''));
  }

  assert.equal(masks.size, 3);
});
