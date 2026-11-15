import { readFileSync, writeFileSync } from 'node:fs';
import { URL } from 'node:url';
import { PNG } from 'pngjs';

const root = new URL('../assets/objects/fridge/', import.meta.url);
const jobs = [
  { name: 'upright', width: 160, height: 320 },
  { name: 'ajar', width: 160, height: 320 },
  { name: 'open', width: 208, height: 320 },
];

function alphaBounds(image) {
  let left = image.width,
    top = image.height,
    right = -1,
    bottom = -1;

  for (let y = 0; y < image.height; y++)
    for (let x = 0; x < image.width; x++)
      if (image.data[(y * image.width + x) * 4 + 3] > 32) {
        left = Math.min(left, x);
        top = Math.min(top, y);
        right = Math.max(right, x);
        bottom = Math.max(bottom, y);
      }
  if (right < left) throw new Error('Empty fridge source');
  return { left, top, right, bottom };
}

function copyCluster(image, output, box, x, y) {
  const sx = Math.round(box.left + ((x + 1) / output.width) * (box.right - box.left));
  const sy = Math.round(box.top + ((y + 1) / output.height) * (box.bottom - box.top));
  const offset = (sy * image.width + sx) * 4;
  const rgba = [...image.data.subarray(offset, offset + 3), image.data[offset + 3] > 127 ? 255 : 0];

  for (let a = 0; a < 2; a++)
    for (let b = 0; b < 2; b++) output.data.set(rgba, ((y + a) * output.width + x + b) * 4);
}

for (const job of jobs) {
  const image = PNG.sync.read(readFileSync(new URL(`sources/${job.name}.png`, root)));
  const box = alphaBounds(image);
  const output = new PNG({ width: job.width, height: job.height });

  for (let y = 0; y < job.height; y += 2)
    for (let x = 0; x < job.width; x += 2) copyCluster(image, output, box, x, y);
  writeFileSync(new URL(`${job.name}.png`, root), PNG.sync.write(output));
}
