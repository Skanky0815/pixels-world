import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import { PNG } from 'pngjs';
import { SARA_CLIPS, SARA_SPRITE } from '../../src/game/actors/sara-animations.ts';
import { SARA_ANIMATIONS } from '../../src/content/sara-reactions.ts';

const sheet = PNG.sync.read(
  fs.readFileSync(new URL('../../assets/sara/sara-sheet-v1.png', import.meta.url)),
);
const master = PNG.sync.read(
  fs.readFileSync(new URL('../../assets/sara/reference-v4/sara-idle-left-v4.png', import.meta.url)),
);

// eslint-disable-next-line max-lines-per-function -- Der vollständige Assetvertrag prüft Größe, jeden Frame, Alpha, Palette und gemeinsame Fußlinie zusammen.
test('Saras zwölf Frames behalten transparente Ränder, gemeinsame Palette und Fußlinie', () => {
  assert.deepEqual([sheet.width, sheet.height], [384, 192]);
  const colors = new Set<string>();
  const frames = new Set<string>();

  for (let frame = 0; frame < 12; frame++) {
    const image = extractFrame(frame);
    const bounds = visibleBounds(image, colors);

    assert.equal(bounds.bottom, 89, `Sole row in frame ${frame}`);
    assert.ok(bounds.top >= 25 && bounds.top <= 35, `Head scale in frame ${frame}`);
    assert.ok(bounds.left > 0 && bounds.right < 63, `Unclipped silhouette in frame ${frame}`);
    frames.add(image.data.toString('base64'));
  }

  assert.ok(colors.size <= 24);
  assert.equal(frames.size, 12, 'Every pose must contain distinct artwork');
});

test('Die bestätigte Idle-Silhouette bleibt erhalten; nur ihre Farben werden angeglichen', () => {
  const idle = extractFrame(0);

  for (let i = 3; i < idle.data.length; i += 4) assert.equal(idle.data[i], master.data[i]);
});

// eslint-disable-next-line max-lines-per-function -- Alle semantischen Keys, Framegrenzen und Wiederholungsregeln werden als gemeinsamer Animationsvertrag geprüft.
test('Saras Animationsvertrag deckt Eintritt, Idle und alle drei Reaktionen ab', () => {
  assert.deepEqual(Object.keys(SARA_CLIPS).sort(), Object.values(SARA_ANIMATIONS).sort());
  assert.equal(SARA_SPRITE.scale, 2);
  assert.deepEqual(SARA_SPRITE.origin, { x: 0.5, y: 90 / 96 });

  for (const [key, clip] of Object.entries(SARA_CLIPS)) {
    assert.ok(clip.frames.length >= 2);
    assert.ok(clip.frameRate > 0);

    for (const frame of clip.frames) assert.ok(Number.isInteger(frame) && frame >= 0 && frame < 12);
    assert.equal(clip.repeat, key.startsWith('sara-react-') ? 0 : -1);
  }
});

function extractFrame(frame: number) {
  const output = new PNG({ width: 64, height: 96 });

  PNG.bitblt(sheet, output, (frame % 6) * 64, Math.floor(frame / 6) * 96, 64, 96, 0, 0);

  return output;
}

// eslint-disable-next-line max-lines-per-function -- Die zusammenhängende Bildauswertung zählt keine transparenten Pixel als Farbe und prüft jeden Alphawert.
function visibleBounds(image: PNG, colors: Set<string>) {
  let left = 64,
    right = 0,
    top = 96,
    bottom = 0;

  for (let y = 0; y < 96; y++) {
    for (let x = 0; x < 64; x++) {
      const i = (y * 64 + x) * 4;
      const alpha = image.data[i + 3];

      assert.ok(alpha === 0 || alpha === 255, 'Binary alpha, no halo');

      if (alpha === 0) continue;
      colors.add(image.data.subarray(i, i + 3).toString('hex'));
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    }
  }

  return { left, right, top, bottom };
}
