import { readFileSync, writeFileSync } from 'node:fs';
import { URL } from 'node:url';
import { PNG } from 'pngjs';
import { alphaBounds, copyPixel2x2 } from './pixel-export.mjs';

const root = new URL('../../assets/objects/food-bowl/', import.meta.url);
const minimumAlpha = 192;
const jobs = [{ name: 'food-bowl', width: 36, height: 16 }];

function exportAsset(job) {
  const source = new URL(`sources/${job.name}-source-v${job.version ?? 1}.png`, root);
  const image = PNG.sync.read(readFileSync(source));
  const box = job.opaque
    ? { left: 0, top: 0, width: image.width, height: image.height }
    : alphaBounds(image, minimumAlpha, 'Empty food-bowl source');
  const output = new PNG({ width: job.width, height: job.height });

  for (let y = 0; y < job.height / 2; y++)
    for (let x = 0; x < job.width / 2; x++) copyPixel2x2(image, output, box, x, y, minimumAlpha);
  writeFileSync(new URL(`${job.name}.png`, root), PNG.sync.write(output));
}

for (const job of jobs) exportAsset(job);
