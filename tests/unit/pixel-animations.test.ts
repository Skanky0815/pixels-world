import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import { PNG } from 'pngjs';
import { pixelAnimation } from '../../src/game/actors/pixel-animations.ts';

const still = { climbing: false, sliding: false, grounded: true, velocityX: 0, velocityY: 0, scratching: false, nibbling: false, landing: false };

test('Luft- und Kletterzustände haben Vorrang vor alten Interaktionszuständen', () => {
  assert.equal(pixelAnimation({ ...still, grounded: false, velocityY: -200, scratching: true }), 'jump');
  assert.equal(pixelAnimation({ ...still, grounded: false, velocityY: 0 }), 'apex');
  assert.equal(pixelAnimation({ ...still, grounded: false, velocityY: 200 }), 'fall');
  assert.equal(pixelAnimation({ ...still, climbing: true, nibbling: true }), 'climb');
  assert.equal(pixelAnimation({ ...still, climbing: true, sliding: true }), 'slide');
});

test('Neue Bewegung unterbricht Landepose; Bodeninteraktionen wechseln zurück zu Idle', () => {
  assert.equal(pixelAnimation({ ...still, landing: true, velocityX: 230 }), 'walk');
  assert.equal(pixelAnimation({ ...still, landing: true }), 'land');
  assert.equal(pixelAnimation({ ...still, scratching: true }), 'scratch');
  assert.equal(pixelAnimation({ ...still, nibbling: true }), 'nibble');
  assert.equal(pixelAnimation(still), 'idle');
});

test('Sprite-Sheet hat 25 belegte 32×32-Zellen und bewahrt den bestätigten Master exakt', () => {
  const sheet = PNG.sync.read(fs.readFileSync(new URL('../../assets/pixel/pixel-sheet.png', import.meta.url)));
  const master = PNG.sync.read(fs.readFileSync(new URL('../../assets/pixel/pixel-idle-master.png', import.meta.url)));
  assert.deepEqual([sheet.width, sheet.height], [160, 160]);
  assert.deepEqual([master.width, master.height], [32, 32]);
  for (let y = 0; y < 32; y++) assert.deepEqual(sheet.data.subarray(y * 160 * 4, (y * 160 + 32) * 4), master.data.subarray(y * 32 * 4, (y + 1) * 32 * 4));
  for (let frame = 0; frame < 25; frame++) {
    let visible = 0, clear = 0, minY = 32, maxY = -1;
    for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
      const alpha = sheet.data[(((Math.floor(frame / 5) * 32 + y) * 160) + (frame % 5) * 32 + x) * 4 + 3];
      if (alpha > 32) { visible++; minY = Math.min(minY, y); maxY = Math.max(maxY, y); } else clear++;
    }
    if (frame >= 5 && frame <= 9) assert.ok(maxY - minY + 1 >= 27, `Walk frame ${frame} must retain idle-scale height`);
    assert.ok(visible > 100, `Frame ${frame} must show a sprite`);
    assert.ok(clear > 100, `Frame ${frame} must retain transparent padding`);
  }
});
