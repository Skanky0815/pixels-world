import { readFileSync, writeFileSync } from 'node:fs';
import { URL } from 'node:url';
import { PNG } from 'pngjs';
import { log } from 'node:console';

const root = new URL('../assets/sara/', import.meta.url);
const read = (path) => PNG.sync.read(readFileSync(new URL(path, root)));
const idle = read('sara-sheet-v1.png');
const palette = JSON.parse(
  readFileSync(new URL('animation-v1/metadata-v1.json', root)),
).palette.map((hex) => [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)));
const sheet = new PNG({ width: 576, height: 288 });
const sources = [
  { file: 'sara-pet-source-v1.png', columns: 3, count: 6, offset: 0 },
  { file: 'sara-head-source-v1.png', columns: 3, count: 6, offset: 6 },
  { file: 'sara-sulk-source-v1.png', columns: 2, count: 4, offset: 12 },
];
const metadata = [];

function bounds(image, index, columns) {
  const w = image.width / columns,
    h = image.height / 2;
  const x0 = (index % columns) * w,
    y0 = Math.floor(index / columns) * h;
  const box = { left: w, right: 0, top: h, bottom: 0 };
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (image.data[((y0 + y) * image.width + x0 + x) * 4 + 3] < 192) continue;
      box.left = Math.min(box.left, x);
      box.right = Math.max(box.right, x);
      box.top = Math.min(box.top, y);
      box.bottom = Math.max(box.bottom, y);
    }
  return { ...box, x0, y0 };
}

function footCenter(image, box) {
  const xs = [];
  for (let y = box.bottom - 12; y <= box.bottom; y++)
    for (let x = box.left; x <= box.right; x++)
      if (image.data[((box.y0 + y) * image.width + box.x0 + x) * 4 + 3] >= 192) xs.push(x);
  return (Math.min(...xs) + Math.max(...xs)) / 2;
}

const colors = new Map();
function quantize(rgb) {
  const key = rgb.join(',');
  if (!colors.has(key))
    colors.set(
      key,
      palette.reduce((best, color) =>
        color.reduce((n, c, i) => n + (c - rgb[i]) ** 2, 0) <
        best.reduce((n, c, i) => n + (c - rgb[i]) ** 2, 0)
          ? color
          : best,
      ),
    );
  return colors.get(key);
}

function put(image, sx, sy, frame, x, y) {
  if (sx < 0 || sy < 0 || sx >= image.width || sy >= image.height) return;
  const offset = (sy * image.width + sx) * 4;
  if (image.data[offset + 3] < 192) return;
  const target = ((Math.floor(frame / 6) * 96 + y) * sheet.width + (frame % 6) * 96 + x) * 4;
  sheet.data.set([...quantize([...image.data.subarray(offset, offset + 3)]), 255], target);
}

for (const source of sources) {
  const image = read('ending-v1/' + source.file);
  const boxes = Array.from({ length: source.count }, (_, i) => bounds(image, i, source.columns));
  const scale = 60 / (boxes[0].bottom - boxes[0].top + 1);
  const anchor = footCenter(image, boxes[0]);
  metadata.push({ ...source, scale, anchor, boxes });
  for (let frame = 0; frame < source.count; frame++)
    for (let y = 0; y < 96; y++)
      for (let x = 0; x < 96; x++) {
        if (frame === 0) {
          if (x >= 16 && x < 80) put(idle, x - 16, y, source.offset, x, y);
        } else {
          const box = boxes[frame];
          const sx = Math.floor(anchor + (x - 48 + 0.5) / scale);
          const sy = Math.floor(box.bottom + (y - 89 + 0.5) / scale);
          if (sx < box.left || sx > box.right || sy < box.top || sy > box.bottom) continue;
          put(image, box.x0 + sx, box.y0 + sy, frame + source.offset, x, y);
        }
      }
}
writeFileSync(new URL('ending-v1/ending-sheet-v1.png', root), PNG.sync.write(sheet));
writeFileSync(
  new URL('ending-v1/metadata-v1.json', root),
  JSON.stringify(
    {
      frameWidth: 96,
      frameHeight: 96,
      columns: 6,
      soleRow: 89,
      alphaThreshold: 192,
      palette,
      sources: metadata,
    },
    null,
    2,
  ) + '\n',
);
log('16 Abschlussframes exportiert; bestehende Idle-Silhouette und Sara-Palette erhalten.');
