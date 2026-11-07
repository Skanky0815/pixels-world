import { readFileSync, writeFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import { URL } from 'node:url';

const root = new URL('../assets/objects/catgrass/', import.meta.url);
const read = (name) => PNG.sync.read(readFileSync(new URL(`sources/${name}-source-v1.png`, root)));

function bounds(source) {
  let l = source.width,
    t = source.height,
    r = -1,
    b = -1;
  for (let y = 0; y < source.height; y++)
    for (let x = 0; x < source.width; x++)
      if (source.data[(y * source.width + x) * 4 + 3] >= 192) {
        l = Math.min(l, x);
        t = Math.min(t, y);
        r = Math.max(r, x);
        b = Math.max(b, y);
      }
  if (r < l) throw new Error('Empty catgrass source');
  return { l, t, w: r - l + 1, h: b - t + 1 };
}

function fit(box, width, height, maxWidth, maxHeight) {
  const scale = Math.min(maxWidth / box.w, maxHeight / box.h);
  const w = Math.round(box.w * scale),
    h = Math.round(box.h * scale);
  return { w, h, x: Math.floor((width - w) / 2), y: height - h };
}

function sample(source, box, target, width, height) {
  const out = new PNG({ width, height });
  for (let y = 0; y < target.h; y++)
    for (let x = 0; x < target.w; x++) {
      const sx = box.l + Math.min(box.w - 1, Math.floor(((x + 0.5) * box.w) / target.w));
      const sy = box.t + Math.min(box.h - 1, Math.floor(((y + 0.5) * box.h) / target.h));
      const offset = (sy * source.width + sx) * 4;
      source.data.copy(out.data, ((target.y + y) * width + target.x + x) * 4, offset, offset + 4);
    }
  return out;
}

const intactSource = read('intact'),
  bittenSource = read('bitten');
if (intactSource.width !== bittenSource.width || intactSource.height !== bittenSource.height)
  throw new Error('Catgrass state sources must share a canvas');
const box = bounds(intactSource),
  target = fit(box, 40, 60, 38, 56);
const intact = sample(intactSource, box, target, 40, 60);
const bitten = sample(bittenSource, box, target, 40, 60);
// Preserve the entire approved pot, rim and bottom anchor byte-for-byte in both states.
intact.data.copy(bitten.data, 39 * 40 * 4, 39 * 40 * 4);
const soilSource = read('soil'),
  soilBox = bounds(soilSource);
const soil = sample(soilSource, soilBox, fit(soilBox, 80, 10, 78, 8), 80, 10);
for (const [name, png] of Object.entries({ intact, bitten, soil }))
  writeFileSync(new URL(`catgrass-${name}.png`, root), PNG.sync.write(png));
