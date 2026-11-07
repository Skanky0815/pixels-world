import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import { OBJECTS } from '../../src/content/objects/catalog.ts';
import { LIVING_ROOM } from '../../src/content/rooms/living-room.ts';
import { resolveRoom } from '../../src/game/content/resolve-room.ts';
import { VASE_APPEARANCES } from '../../src/game/assets/vase-appearance.ts';

function art(name: string) {
  return PNG.sync.read(
    readFileSync(new URL(`../../assets/objects/vases/${name}.png`, import.meta.url)),
  );
}

// eslint-disable-next-line max-lines-per-function -- Tatsächliche Exportdateien sichern transparente, verschiedene Silhouetten und den gemeinsamen Bodenanker.
test('Vier verschiedene Vasensilhouetten passen in transparente 18×28-Zellen', () => {
  const masks = new Set<string>();

  for (const appearance of VASE_APPEARANCES) {
    const png = art(`vase-${appearance}-intact`);

    assert.deepEqual([png.width, png.height], [18, 28]);
    const alpha = [...png.data].filter((_, index) => index % 4 === 3);

    assert.ok(alpha.some((a) => a === 0));
    assert.ok(alpha.slice(-18).some((a) => a > 0));
    assert.ok(alpha.some((a) => a > 0));
    masks.add(alpha.map((a) => (a > 0 ? '1' : '0')).join(''));
  }

  assert.equal(masks.size, 4);
});

test('Alle drei Farbgruppen besitzen transparente kleine Scherben', () => {
  for (const name of ['terracotta', 'blue', 'gold']) {
    const png = art(`vase-${name}-shard`);
    const alpha = [...png.data].filter((_, index) => index % 4 === 3);

    assert.deepEqual([png.width, png.height], [8, 8]);
    assert.ok(alpha.includes(0) && alpha.some((a) => a > 0));
  }
});

// eslint-disable-next-line max-lines-per-function -- Optionale Grafik und alter Farbvertrag werden gemeinsam gegen die Content-Auflösung geprüft.
test('Grafikauswahl ist typisiert und alte farbbasierte Vasen bleiben kompatibel', () => {
  assert.throws(
    () =>
      resolveRoom(LIVING_ROOM, {
        ...OBJECTS,
        'small-vase': { ...OBJECTS['small-vase'], appearance: 'missing' },
      } as unknown as typeof OBJECTS),
    /appearance/,
  );
  const catalog = { ...OBJECTS, 'small-vase': { ...OBJECTS['small-vase'], appearance: undefined } };
  const legacy = resolveRoom(LIVING_ROOM, catalog).objects.find((o) => o.id === 'small-vase');

  assert.ok(legacy?.kind === 'vase');
  assert.equal(legacy.config.appearance, undefined);
  assert.equal(legacy.config.color, OBJECTS['small-vase'].color);
  assert.equal(legacy.config.points, 25);
});
