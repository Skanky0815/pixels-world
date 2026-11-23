import { readFileSync, writeFileSync } from 'node:fs';
import { URL } from 'node:url';
import { PNG } from 'pngjs';
import { alphaBounds, copyPixel2x2 } from './pixel-export.mjs';

const root = new URL('../../assets/objects/trash-bin/', import.meta.url);
const minimumAlpha = 192;
const jobs = [
  { name: 'intact', width: 48, height: 60 },
  { name: 'spilled', width: 132, height: 46 },
];

function exportAsset(job) {
  const source = new URL(`sources/${job.name}-source-v${job.version ?? 1}.png`, root);
  const image = PNG.sync.read(readFileSync(source));
  const box = job.opaque
    ? { left: 0, top: 0, width: image.width, height: image.height }
    : alphaBounds(image, minimumAlpha, 'Empty rubbish bin source');
  const output = new PNG({ width: job.width, height: job.height });

  for (let y = 0; y < job.height / 2; y++)
    for (let x = 0; x < job.width / 2; x++) copyPixel2x2(image, output, box, x, y, minimumAlpha);
  writeFileSync(new URL(`${job.name}.png`, root), PNG.sync.write(output));
}

for (const job of jobs) exportAsset(job);
