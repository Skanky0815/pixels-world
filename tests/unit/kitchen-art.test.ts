import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { PNG } from 'pngjs';
import { KITCHEN_PREVIEW } from '../../src/content/rooms/kitchen-preview.ts';

const root = new URL('../../assets/environment/kitchen/', import.meta.url);
const image = (name: string) => PNG.sync.read(readFileSync(new URL(`kitchen-${name}.png`, root)));

// eslint-disable-next-line max-lines-per-function -- Möbelbilder werden gegen die tatsächlichen Auflagen und den Bodenanker des Raums geprüft.
test('Küchenmöbel passen exakt zu ihren Auflagen und behalten transparente Zwischenräume', () => {
  for (const platform of KITCHEN_PREVIEW.platforms) {
    if (!('appearance' in platform)) continue;
    const png = image(platform.appearance);

    assert.equal(png.width, platform.bounds.width);
    assert.equal(png.height, KITCHEN_PREVIEW.floor.y - platform.bounds.y);
    const alpha = png.data.filter((_, index) => index % 4 === 3);

    assert.ok(alpha.includes(255));

    if (platform.appearance !== 'counter') assert.ok(alpha.includes(0));
    assert.ok(alpha.every((value) => value === 0 || value === 255));
  }
});

// eslint-disable-next-line max-lines-per-function -- Geschlossene Schrankfronten und deckende Wand-/Bodenkacheln dürfen keine Löcher in den Raum zeichnen.
test('Schrankfronten sind geschlossen und alle Küchentexturen vollständig deckend', () => {
  const cabinet = image('wall-cabinet');

  assert.deepEqual([cabinet.width, cabinet.height], [340, 78]);

  for (const name of ['wall-cabinet', 'counter']) {
    const front = image(name);

    for (let y = 8; y < front.height - 8; y++)
      for (let x = 8; x < front.width - 8; x++)
        assert.equal(front.data[(y * front.width + x) * 4 + 3], 255);
  }

  for (const name of ['plaster', 'wall-tiles', 'floor-tiles']) {
    const png = image(name);

    assert.ok(png.data.every((value, index) => index % 4 !== 3 || value === 255));
  }
});
