import { readFileSync, writeFileSync } from 'node:fs';
import { URL } from 'node:url';
import { PNG } from 'pngjs';

const environment = [
  ['door',112,216], ['window',112,184], ['bed',264,128],
  ['nightstand',72,64], ['wardrobe',120,278],
  ['plaster',256,256,true], ['floor',512,128,true],
];
const objects = [
  ['curtain', 40, 120],
  ['curtain-tear', 18, 26],
  ['catbed',96,30], ['lamp',28,38], ['runner',310,36],
  ['laundry-folded',96,48], ['laundry-rumpled',96,48], ['laundry-spilled',152,48],
  ['basket-upright',80,48], ['basket-spilled',152,48],
  ['spiderplant-intact',40,60], ['spiderplant-bitten',40,60],
];
const jobs = [
  ...environment.map(([name,width,height,opaque]) => ({name,width,height,opaque,family:'environment'})),
  ...objects.map(([name,width,height]) => ({name,width,height,family:'objects'})),
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

  if (right < left) throw new Error('Empty bedroom source');

  return { left, top, width: right - left + 1, height: bottom - top + 1 };
}

function copyPixel(image, output, box, x, y) {
  const sx =
    box.left + Math.min(box.width - 1, Math.floor(((x + 0.5) * box.width) / (output.width / 2)));
  const sy =
    box.top + Math.min(box.height - 1, Math.floor(((y + 0.5) * box.height) / (output.height / 2)));
  const source = (sy * image.width + sx) * 4;

  if (image.data[source + 3] < 192) return;

  for (let dy = 0; dy < 2; dy++)
    for (let dx = 0; dx < 2; dx++) {
      const target = ((y * 2 + dy) * output.width + x * 2 + dx) * 4;

      output.data.set([...image.data.subarray(source, source + 3), 255], target);
    }
}

function exportAsset(job) {
  const root = new URL(`../../assets/${job.family}/bedroom/`, import.meta.url);
  const source = new URL(`sources/${job.name}-source-v${job.name === 'window' ? 2 : 1}.png`, root);
  const image = PNG.sync.read(readFileSync(source));
  const box = job.opaque
    ? { left: 0, top: 0, width: image.width, height: image.height }
    : bounds(image);
  const output = new PNG({ width: job.width, height: job.height });

  for (let y = 0; y < job.height / 2; y++)
    for (let x = 0; x < job.width / 2; x++) copyPixel(image, output, box, x, y);
  writeFileSync(new URL(`bedroom-${job.name}.png`, root), PNG.sync.write(output));
}

for (const job of jobs) exportAsset(job);
