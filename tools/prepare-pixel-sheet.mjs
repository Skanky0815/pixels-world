import fs from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import console from 'node:console';
import { PNG } from 'pngjs';

const root = fileURLToPath(new URL('../assets/pixel/', import.meta.url));
const source = PNG.sync.read(fs.readFileSync(`${root}pixel-sheet-source.png`));
const master = PNG.sync.read(fs.readFileSync(`${root}pixel-idle-master.png`));
if (master.width !== 32 || master.height !== 32) throw new Error('Expected a 32×32 master');
// Extract disconnected sprites; generated sheet spacing is not a reliable pixel grid.
function extractSprites(source, expected) {
  const seen = new Uint8Array(source.width * source.height);
  const components = [];
  for (let i = 0; i < seen.length; i++) {
    if (seen[i] || source.data[i * 4 + 3] <= 32) continue;
    const pixels = [i];
    seen[i] = 1;
    let left = source.width,
      top = source.height,
      right = 0,
      bottom = 0;
    for (let n = 0; n < pixels.length; n++) {
      const index = pixels[n],
        x = index % source.width,
        y = Math.floor(index / source.width);
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
      for (const [dx, dy] of [
        [0, 1],
        [0, -1],
        [1, 0],
        [-1, 0],
      ]) {
        const xx = x + dx,
          yy = y + dy,
          next = yy * source.width + xx;
        if (
          xx >= 0 &&
          xx < source.width &&
          yy >= 0 &&
          yy < source.height &&
          !seen[next] &&
          source.data[next * 4 + 3] > 32
        ) {
          seen[next] = 1;
          pixels.push(next);
        }
      }
    }
    if (pixels.length > 1000)
      components.push({ left, top, right, bottom, pixels: new Set(pixels) });
  }
  if (components.length !== expected)
    throw new Error(`Expected ${expected} sprites, found ${components.length}`);
  return components;
}
const components = extractSprites(source, 25);
components.sort((a, b) => a.top - b.top);
const frames = [];
for (let row = 0; row < 5; row++)
  frames.push(...components.slice(row * 5, row * 5 + 5).sort((a, b) => a.left - b.left));
const walkSource = PNG.sync.read(fs.readFileSync(`${root}pixel-walk-source.png`));
const walkFrames = extractSprites(walkSource, 5).sort((a, b) => a.left - b.left);
frames.splice(5, 5, ...walkFrames.map((frame) => ({ ...frame, image: walkSource })));
const sheet = new PNG({ width: 160, height: 160 });
const groups = [
  [0, 1, 2],
  [3, 4],
  [5, 6, 7, 8, 9],
  [10, 11, 12, 13, 14],
  [15, 16, 17, 18, 19],
  [20, 21, 22],
  [23, 24],
];
for (const group of groups) {
  const scale =
    30 /
    Math.max(
      ...group.flatMap((i) => [
        frames[i].right - frames[i].left + 1,
        frames[i].bottom - frames[i].top + 1,
      ]),
    );
  for (const i of group) {
    const frame = frames[i],
      image = frame.image ?? source,
      sw = frame.right - frame.left + 1,
      sh = frame.bottom - frame.top + 1;
    const w = Math.round(sw * scale),
      h = Math.round(sh * scale);
    const ox = (i % 5) * 32 + Math.floor((32 - w) / 2),
      oy = Math.floor(i / 5) * 32 + 31 - h;
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const sx = frame.left + Math.min(sw - 1, Math.floor(((x + 0.5) * sw) / w));
        const sy = frame.top + Math.min(sh - 1, Math.floor(((y + 0.5) * sh) / h));
        const si = sy * image.width + sx;
        if (frame.pixels.has(si))
          image.data.copy(sheet.data, ((oy + y) * 160 + ox + x) * 4, si * 4, si * 4 + 4);
      }
  }
}
// The approved idle pose is kept byte-for-byte, not regenerated.
for (let y = 0; y < 32; y++)
  master.data.copy(sheet.data, y * 160 * 4, y * 32 * 4, (y + 1) * 32 * 4);
fs.writeFileSync(`${root}pixel-sheet.png`, PNG.sync.write(sheet));
const preview = new PNG({ width: 800, height: 800 });
for (let y = 0; y < 800; y++)
  for (let x = 0; x < 800; x++) {
    const si = (Math.floor(y / 5) * 160 + Math.floor(x / 5)) * 4;
    sheet.data.copy(preview.data, (y * 800 + x) * 4, si, si + 4);
  }
fs.writeFileSync(`${root}pixel-sheet-preview.png`, PNG.sync.write(preview));
console.log('25 frames packed into 160×160; 32×32 cells, baseline 30; approved frame 0 preserved.');
