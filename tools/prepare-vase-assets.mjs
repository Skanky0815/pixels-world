import { readFileSync, writeFileSync } from 'node:fs';
import { URL } from 'node:url';
import { PNG } from 'pngjs';

const root = new URL('../assets/objects/vases/', import.meta.url);
const jobs = [
  ...['terracotta', 'blue', 'gold', 'mellow'].map((name) => ({
    source: `sources/${name}-source-${name === 'mellow' ? 'v2' : 'v1'}.png`,
    output: `vase-${name}-intact.png`,
    width: 18,
    height: 28,
    maxWidth: 16,
    maxHeight: 26,
    bottom: true,
  })),
  ...['terracotta', 'blue', 'gold'].map((name) => ({
    source: `sources/${name}-shard-source-v1.png`,
    output: `vase-${name}-shard.png`,
    width: 8,
    height: 8,
    maxWidth: 6,
    maxHeight: 4,
    bottom: false,
  })),
];

function bounds(source) {
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

  if (right < left) throw new Error('Empty vase source');

  return { left, top, width: right - left + 1, height: bottom - top + 1 };
}

function target(box, job) {
  const scale = Math.min(job.maxWidth / box.width, job.maxHeight / box.height);
  const width = Math.max(1, Math.round(box.width * scale));
  const height = Math.max(1, Math.round(box.height * scale));

  return {
    width,
    height,
    x: Math.floor((job.width - width) / 2),
    y: job.bottom ? job.height - height : Math.floor((job.height - height) / 2),
  };
}

function copyPixel(source, output, box, fit, x, y) {
  const sx = box.left + Math.min(box.width - 1, Math.floor(((x + 0.5) * box.width) / fit.width));
  const sy = box.top + Math.min(box.height - 1, Math.floor(((y + 0.5) * box.height) / fit.height));
  const offset = (sy * source.width + sx) * 4;

  source.data.copy(output.data, ((fit.y + y) * output.width + fit.x + x) * 4, offset, offset + 4);
}

function exportAsset(job) {
  const source = PNG.sync.read(readFileSync(new URL(job.source, root)));
  const box = bounds(source),
    fit = target(box, job);
  const output = new PNG({ width: job.width, height: job.height });

  for (let y = 0; y < fit.height; y++)
    for (let x = 0; x < fit.width; x++) copyPixel(source, output, box, fit, x, y);
  writeFileSync(new URL(job.output, root), PNG.sync.write(output));
}

for (const job of jobs) exportAsset(job);
