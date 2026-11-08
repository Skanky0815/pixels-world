import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { PNG } from 'pngjs';
import { OBJECTS } from '../../src/content/objects/catalog.ts';
import { LIVING_ROOM } from '../../src/content/rooms/living-room.ts';
import { resolveRoom } from '../../src/game/content/resolve-room.ts';
import type { ObjectCatalog } from '../../src/game/content/definitions.ts';
import { PICTURE_ALBUM } from '../../src/content/album/pictures.ts';

// eslint-disable-next-line max-lines-per-function -- Alle drei echten PNGs müssen dieselbe transparente Spielzelle und unterschiedliche Motive besitzen.
test('Pixel, Fernsehturm und Fensternische sind getrennte transparente PNGs mit stabilen Katalog- und Album-IDs', () => {
  const hashes = new Set<string>();

  for (const [key, entry] of Object.entries(PICTURE_ALBUM)) {
    const variant = OBJECTS[key as keyof typeof OBJECTS];

    assert.equal(variant.kind, 'picture');

    if (variant.kind !== 'picture') throw new Error('wrong object kind');
    assert.equal(entry.asset, `picture-${variant.appearance}`);
    const data = readFileSync(
      new URL(`../../assets/objects/pictures/${entry.asset}.png`, import.meta.url),
    );
    const png = PNG.sync.read(data);

    assert.deepEqual([png.width, png.height], [54, 56]);
    const alpha = [...png.data].filter((_, i) => i % 4 === 3);

    assert.equal(alpha[0], 0);
    assert.ok(alpha.some((v) => v === 0) && alpha.some((v) => v >= 250));
    hashes.add(createHash('sha256').update(data).digest('hex'));
  }

  assert.equal(hashes.size, 3);
});

// eslint-disable-next-line max-lines-per-function -- Alle Bildvorlagen werden unabhängig von ihrer aktuellen Slotbelegung validiert.
test('Unbekannte Bildmotive und ungültige Regeln scheitern vor dem Szenenaufbau', () => {
  for (const change of [
    { appearance: 'unknown' },
    { rules: { points: 1, wobbleMs: 0, fallMs: 100 } },
    { spawn: { ...OBJECTS['pixel-portrait'].spawn, random: true, support: 'floor' } },
  ])
    assert.throws(() =>
      resolveRoom(LIVING_ROOM, {
        ...OBJECTS,
        'pixel-portrait': { ...OBJECTS['pixel-portrait'], ...change },
      } as unknown as ObjectCatalog),
    );
});
