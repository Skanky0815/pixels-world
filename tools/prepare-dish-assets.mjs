import { readFileSync, writeFileSync } from 'node:fs';
import { URL } from 'node:url';
import { PNG } from 'pngjs';

const root = new URL('../assets/objects/dishes/', import.meta.url);
const jobs = [
  { name: 'cup', width: 24, height: 26, version: 2 },
  { name: 'plate', width: 32, height: 10, version: 2 },
  { name: 'shard', width: 10, height: 8 },
];

function bounds(image) {
  let left = image.width,
    top = image.height,
    right = -1,
    bottom = -1;

  for (let y = 0; y < image.height; y++)
    for (let x = 0; x < image.width; x++)
      if (image.data[(y * image.width + x) * 4 + 3] >= 192) {
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }

  if (right < left) throw new Error('Empty dish source');

  return { left, top, width: right - left + 1, height: bottom - top + 1 };
}

function copyPixel(image, output, box, x, y, alignEdges) {
  const sx = box.left + samplePosition(x, output.width / 2, box.width, alignEdges);
  const sy = box.top + samplePosition(y, output.height / 2, box.height, alignEdges);
  const source = (sy * image.width + sx) * 4;

  if (image.data[source + 3] < 192) return;

  for (let dy = 0; dy < 2; dy++)
    for (let dx = 0; dx < 2; dx++) {
      const target = ((y * 2 + dy) * output.width + x * 2 + dx) * 4;

      output.data.set([...image.data.subarray(source, source + 3), 255], target);
    }
}

function samplePosition(index, count, size, alignEdges) {
  return alignEdges
    ? Math.round((index * (size - 1)) / (count - 1))
    : Math.min(size - 1, Math.floor(((index + 0.5) * size) / count));
}

function exportAsset(job) {
  const source = new URL(`sources/${job.name}-source-v${job.version ?? 1}.png`, root);
  const image = PNG.sync.read(readFileSync(source));
  const box = job.opaque
    ? { left: 0, top: 0, width: image.width, height: image.height }
    : bounds(image);
  const output = new PNG({ width: job.width, height: job.height });

  for (let y = 0; y < job.height / 2; y++)
    for (let x = 0; x < job.width / 2; x++) copyPixel(image, output, box, x, y, job.version === 2);
  writeFileSync(new URL(`${job.name}.png`, root), PNG.sync.write(output));
}

for (const job of jobs) exportAsset(job);
