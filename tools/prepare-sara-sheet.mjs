import fs from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import console from 'node:console';
import { PNG } from 'pngjs';

const root = fileURLToPath(new URL('../assets/sara/', import.meta.url));
const source = PNG.sync.read(fs.readFileSync(`${root}animation-v1/sara-sheet-source-v1.png`));
const master = PNG.sync.read(fs.readFileSync(`${root}reference-v4/sara-idle-left-v4.png`));
const palette = [
  '161315',
  '29272c',
  '3b383f',
  '514d54',
  '69636a',
  '89818a',
  '3c2923',
  '644435',
  '8a634a',
  'b88a56',
  'dab273',
  'f2cb85',
  'ffe2a4',
  'aa6d51',
  'd08d67',
  'edaf83',
  'ffd0a1',
  '465931',
  '75854b',
  'acb375',
  'f7ebce',
  '9b7666',
  'c5a58a',
  'e2c4a2',
].map((hex) => [0, 2, 4].map((offset) => parseInt(hex.slice(offset, offset + 2), 16)));
const width = 64;
const height = 96;
const columns = 6;
const alphaThreshold = 192;

if (master.width !== width || master.height !== height)
  throw new Error('Expected the approved 64×96 reference');

function sourceBounds(frame) {
  const leftEdge = Math.floor(((frame % columns) * source.width) / columns);
  const rightEdge = Math.floor((((frame % columns) + 1) * source.width) / columns);
  const topEdge = Math.floor((Math.floor(frame / columns) * source.height) / 2);
  const bottomEdge = Math.floor(((Math.floor(frame / columns) + 1) * source.height) / 2);
  let top = bottomEdge,
    bottom = topEdge,
    left = rightEdge,
    right = leftEdge,
    count = 0;

  for (let y = topEdge; y < bottomEdge; y++) {
    for (let x = leftEdge; x < rightEdge; x++) {
      if (source.data[(y * source.width + x) * 4 + 3] < alphaThreshold) continue;
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
      left = Math.min(left, x);
      right = Math.max(right, x);
      count++;
    }
  }

  if (count < 5000) throw new Error(`Source cell ${frame} is incomplete`);

  return { left, right, top, bottom, center: (leftEdge + rightEdge) / 2 };
}

const bounds = Array.from({ length: 12 }, (_, frame) => sourceBounds(frame));
// One scale for the entire source sheet. Poses are translated to the same sole row,
// never independently resized. The canonical idle keeps its approved raster geometry.
const sourceScale = 60 / (bounds[0].bottom - bounds[0].top + 1);
// Align every generated pose with the approved idle's lower-leg/shoe centroid.
// This is one shared translation, not per-frame scaling or independent centering.
const horizontalShift = Math.round(
  footAnchor(master, (x, y) => [x, y], 128) -
    footAnchor(source, (x, y) => sourcePoint(0, x, y, 0), alphaThreshold),
);
const sheet = new PNG({ width: columns * width, height: 2 * height });
const nearest = new Map();

function sourcePoint(frame, x, y, shift) {
  return [
    Math.round(bounds[frame].center + (x - 32 - shift) / sourceScale),
    Math.round(bounds[frame].bottom + (y - 89) / sourceScale),
  ];
}

function footAnchor(image, sample, threshold) {
  let sum = 0,
    count = 0;

  for (let y = 78; y <= 89; y++) {
    for (let x = 0; x < width; x++) {
      const [sx, sy] = sample(x, y);

      if (sx < 0 || sx >= image.width || sy < 0 || sy >= image.height) continue;

      if (image.data[(sy * image.width + sx) * 4 + 3] >= threshold) {
        sum += x;
        count++;
      }
    }
  }

  if (!count) throw new Error('Cannot align Sara without visible feet');

  return sum / count;
}

function paletteColor(r, g, b) {
  const key = `${r},${g},${b}`;

  if (nearest.has(key)) return nearest.get(key);
  let best = palette[0],
    distance = Infinity;

  for (const candidate of palette) {
    const delta = candidate.reduce((sum, channel, i) => sum + (channel - [r, g, b][i]) ** 2, 0);

    if (delta < distance) {
      distance = delta;
      best = candidate;
    }
  }

  nearest.set(key, best);

  return best;
}

function copyPixel(image, sx, sy, frame, x, y, threshold) {
  if (sx < 0 || sy < 0 || sx >= image.width || sy >= image.height) return;
  const i = (sy * image.width + sx) * 4;

  if (image.data[i + 3] < threshold) return;
  const color = paletteColor(...image.data.subarray(i, i + 3));
  const output =
    ((Math.floor(frame / columns) * height + y) * sheet.width + (frame % columns) * width + x) * 4;

  sheet.data.set([...color, 255], output);
}

for (let frame = 0; frame < 12; frame++) {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (frame === 0) copyPixel(master, x, y, frame, x, y, 128);
      else {
        const [sx, sy] = sourcePoint(frame, x, y, horizontalShift);

        if (
          sx < bounds[frame].left ||
          sx > bounds[frame].right ||
          sy < bounds[frame].top ||
          sy > bounds[frame].bottom
        )
          continue;
        copyPixel(source, sx, sy, frame, x, y, alphaThreshold);
      }
    }
  }
}

fs.writeFileSync(`${root}sara-sheet-v1.png`, PNG.sync.write(sheet));
const preview = new PNG({ width: sheet.width * 4, height: sheet.height * 4 });

for (let y = 0; y < preview.height; y++) {
  for (let x = 0; x < preview.width; x++) {
    const input = (Math.floor(y / 4) * sheet.width + Math.floor(x / 4)) * 4;

    sheet.data.copy(preview.data, (y * preview.width + x) * 4, input, input + 4);
  }
}

fs.writeFileSync(`${root}animation-v1/sara-sheet-preview-v1.png`, PNG.sync.write(preview));
fs.writeFileSync(
  `${root}animation-v1/metadata-v1.json`,
  JSON.stringify(
    {
      frameWidth: width,
      frameHeight: height,
      columns,
      frames: 12,
      scale: 2,
      origin: { x: 0.5, y: 90 / height },
      soleRow: 89,
      sourceScale,
      horizontalShift,
      sourceBounds: bounds,
      alphaThreshold,
      alpha: [0, 255],
      palette: palette.map((color) =>
        color.map((channel) => channel.toString(16).padStart(2, '0')).join(''),
      ),
      canonicalIdle:
        'reference-v4/sara-idle-left-v4.png; identical silhouette, shared palette mapping',
    },
    null,
    2,
  ) + '\n',
);
console.log(
  `12 Sara frames packed into ${sheet.width}×${sheet.height}; shared ${palette.length}-color palette; sole row 89.`,
);
