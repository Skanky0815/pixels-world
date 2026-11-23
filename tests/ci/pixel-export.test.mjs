import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import { Buffer } from 'node:buffer';
import process from 'node:process';
import { PNG } from 'pngjs';
import { alphaBounds, copyPixel2x2 } from '../../tools/assets/pixel-export.mjs';

const repository = fileURLToPath(new URL('../../', import.meta.url));
const pixel = (image, x, y, rgba) => image.data.set(rgba, (y * image.width + x) * 4);

test('Alpha-Grenzen erhalten Einpixelkonturen, den Schwellwert und die Quellen', () => {
  const image = new PNG({ width: 7, height: 5 });
  pixel(image, 0, 0, [20, 30, 40, 191]);
  pixel(image, 3, 2, [70, 80, 90, 192]);
  const original = Buffer.from(image.data);

  assert.deepEqual(alphaBounds(image, 192, 'Leer'), { left: 3, top: 2, width: 1, height: 1 });
  assert.deepEqual(image.data, original);
  pixel(image, 1, 4, [10, 20, 30, 255]);
  assert.deepEqual(alphaBounds(image, 192, 'Leer'), { left: 1, top: 2, width: 3, height: 3 });
});

test('Leere transparente oder unterschwellige Quellen behalten den Familienfehler', () => {
  const image = new PNG({ width: 2, height: 2 });

  assert.throws(() => alphaBounds(image, 192, 'Empty pantry source'), /Empty pantry source/);
  pixel(image, 1, 1, [255, 255, 255, 191]);
  assert.throws(
    () => alphaBounds(image, 192, 'Empty tablecloth source'),
    /Empty tablecloth source/,
  );
});

test('Zentrierte 2×2-Samples erhalten dünne Ränder und transparente Löcher ohne Glättung', () => {
  const image = new PNG({ width: 5, height: 3 });
  pixel(image, 0, 1, [255, 255, 255, 255]); // Outside the selected crop.
  pixel(image, 1, 1, [201, 40, 10, 192]);
  pixel(image, 2, 1, [100, 100, 100, 191]);
  pixel(image, 3, 1, [10, 50, 211, 255]);
  const original = Buffer.from(image.data);
  const output = new PNG({ width: 8, height: 2 });
  const box = { left: 1, top: 1, width: 3, height: 1 };

  for (let x = 0; x < 4; x++) copyPixel2x2(image, output, box, x, 0, 192);
  const row = [
    ...[201, 40, 10, 255, 201, 40, 10, 255],
    ...Array(16).fill(0),
    ...[10, 50, 211, 255, 10, 50, 211, 255],
  ];

  assert.deepEqual([...output.data], [...row, ...row]);
  assert.deepEqual(image.data, original);
});

const families = [
  ['food-bowl', 'prepare-food-bowl.mjs', ['food-bowl']],
  [
    'pantry',
    'prepare-pantry-assets.mjs',
    ['jar', 'tin', 'jar-broken', 'tin-opened', 'glass-shard'],
  ],
  ['trash-bin', 'prepare-trash-bin-assets.mjs', ['intact', 'spilled']],
  ['tablecloth', 'prepare-tablecloth-assets.mjs', ['pattern', 'pile']],
];

for (const [family, script, names] of families) {
  test(`Export ${family} erhält reale Quellenversionen, Bildmaße und sämtliche RGBA-/Ankerwerte`, (t) => {
    const fixture = mkdtempSync(join(tmpdir(), 'pixels-export-'));
    t.after(() => rmSync(fixture, { recursive: true, force: true }));
    const tools = join(fixture, 'tools/assets');
    const assets = join(fixture, 'assets/objects', family);

    mkdirSync(tools, { recursive: true });
    mkdirSync(join(fixture, 'assets/objects'), { recursive: true });
    cpSync(join(repository, 'assets/objects', family), assets, { recursive: true });
    for (const name of [script, 'pixel-export.mjs'])
      cpSync(join(repository, 'tools/assets', name), join(tools, name));
    symlinkSync(join(repository, 'node_modules'), join(fixture, 'node_modules'), 'dir');
    execFileSync(process.execPath, [join(tools, script)], { cwd: tmpdir(), stdio: 'pipe' });

    for (const name of names) {
      const original = PNG.sync.read(
        readFileSync(join(repository, 'assets/objects', family, `${name}.png`)),
      );
      const exported = PNG.sync.read(readFileSync(join(assets, `${name}.png`)));

      assert.equal(exported.width, original.width, name);
      assert.equal(exported.height, original.height, name);
      assert.deepEqual(exported.data, original.data, name);
    }
  });
}
