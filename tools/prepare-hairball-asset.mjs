import { readFileSync, writeFileSync } from 'node:fs';
import { URL } from 'node:url';
import { PNG } from 'pngjs';
const root = new URL('../assets/objects/carpet/', import.meta.url);
const source = PNG.sync.read(readFileSync(new URL('sources/hairball-source-v1.png', root)));
let left = source.width,
  top = source.height,
  right = -1,
  bottom = -1;
for (let y = 0; y < source.height; y++)
  for (let x = 0; x < source.width; x++)
    if (source.data[(y * source.width + x) * 4 + 3] >= 192) {
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
if (right < left) throw new Error('Empty hairball source');
const scale = Math.min(28 / (right - left + 1), 14 / (bottom - top + 1));
const width = Math.round((right - left + 1) * scale),
  height = Math.round((bottom - top + 1) * scale);
const output = new PNG({ width: 32, height: 16 });
for (let y = 0; y < height; y++)
  for (let x = 0; x < width; x++) {
    const sx = left + Math.min(right - left, Math.floor(((x + 0.5) * (right - left + 1)) / width));
    const sy = top + Math.min(bottom - top, Math.floor(((y + 0.5) * (bottom - top + 1)) / height));
    const from = (sy * source.width + sx) * 4;
    const to = ((y + 16 - height) * 32 + x + Math.floor((32 - width) / 2)) * 4;
    source.data.copy(output.data, to, from, from + 4);
  }
writeFileSync(new URL('hairball.png', root), PNG.sync.write(output));
