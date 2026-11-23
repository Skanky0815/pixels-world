import { readFileSync, writeFileSync } from 'node:fs';
import { URL } from 'node:url';
import { PNG } from 'pngjs';
import { alphaBounds, copyPixel2x2 } from './pixel-export.mjs';

const root = new URL('../../assets/objects/pantry/', import.meta.url);
const minimumAlpha = 192;
const jobs = [
  { name: 'jar', width: 28, height: 34 },
  { name: 'tin', width: 32, height: 28 },
  { name: 'jar-broken', width: 76, height: 24 },
  { name: 'tin-opened', width: 84, height: 32, version: 2 },
  { name: 'glass-shard', width: 8, height: 8 },
];

function exportAsset(job) {
  const source = new URL(`sources/${job.name}-source-v${job.version ?? 1}.png`, root);
  const image = PNG.sync.read(readFileSync(source));
  const box = job.opaque
    ? { left: 0, top: 0, width: image.width, height: image.height }
    : alphaBounds(image, minimumAlpha, 'Empty pantry source');
  const output = new PNG({ width: job.width, height: job.height });

  for (let y = 0; y < job.height / 2; y++)
    for (let x = 0; x < job.width / 2; x++) copyPixel2x2(image, output, box, x, y, minimumAlpha);
  writeFileSync(new URL(`${job.name}.png`, root), PNG.sync.write(output));
}

for (const job of jobs) exportAsset(job);
