import { readFileSync, writeFileSync } from 'node:fs';
import { URL } from 'node:url';
import { PNG } from 'pngjs';

const root = new URL('../assets/pixel/charm-v1/', import.meta.url);
const CELL = 48;
const sheet = new PNG({ width: CELL * 6, height: CELL * 2 });

// Generated spacing is not an engine grid. Use the existing sprite export's
// alpha-component method; ignore weak background residue, preserve sampled RGBA.
function components(source) {
  const seen = new Uint8Array(source.width * source.height);
  const frames = [];

  for (let index = 0; index < seen.length; index++) {
    if (seen[index] || source.data[index * 4 + 3] <= 32) continue;
    const queue = [index];
    const bounds = { left: source.width, top: source.height, right: 0, bottom: 0 };

    seen[index] = 1;
    for (let at = 0; at < queue.length; at++) visit(source, seen, queue, at, bounds);
    if (queue.length > 1000) frames.push({ ...bounds, pixels: new Set(queue) });
  }
  if (frames.length !== 6) throw new Error(`Expected six complete sprites, found ${frames.length}`);
  frames.sort((a, b) => a.top - b.top);

  return [0, 1].flatMap((row) =>
    frames.slice(row * 3, row * 3 + 3).sort((a, b) => a.left - b.left),
  );
}

function visit(source, seen, queue, at, bounds) {
  const index = queue[at],
    x = index % source.width,
    y = Math.floor(index / source.width);

  bounds.left = Math.min(bounds.left, x);
  bounds.right = Math.max(bounds.right, x);
  bounds.top = Math.min(bounds.top, y);
  bounds.bottom = Math.max(bounds.bottom, y);
  for (const [dx, dy] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ]) {
    const xx = x + dx,
      yy = y + dy,
      next = yy * source.width + xx;

    if (
      xx < 0 ||
      xx >= source.width ||
      yy < 0 ||
      yy >= source.height ||
      seen[next] ||
      source.data[next * 4 + 3] <= 32
    )
      continue;
    seen[next] = 1;
    queue.push(next);
  }
}

function pack(source, frame, scale, column, row) {
  const width = frame.right - frame.left + 1,
    height = frame.bottom - frame.top + 1;
  const w = Math.round(width * scale),
    h = Math.round(height * scale);
  const left = column * CELL + 3,
    top = row * CELL + 47 - h;

  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const sx = frame.left + Math.min(width - 1, Math.floor(((x + 0.5) * width) / w));
      const sy = frame.top + Math.min(height - 1, Math.floor(((y + 0.5) * height) / h));
      const index = sy * source.width + sx;

      if (frame.pixels.has(index))
        source.data.copy(
          sheet.data,
          ((top + y) * sheet.width + left + x) * 4,
          index * 4,
          index * 4 + 4,
        );
    }
}

for (const [row, action] of ['headbutt', 'belly'].entries()) {
  const source = PNG.sync.read(readFileSync(new URL(`${action}-source-v1.png`, root)));
  const frames = components(source);
  const maxWidth = Math.max(...frames.map((frame) => frame.right - frame.left + 1));
  const maxHeight = Math.max(...frames.map((frame) => frame.bottom - frame.top + 1));
  const scale = Math.min(42 / maxWidth, 30 / maxHeight);

  frames.forEach((frame, column) => pack(source, frame, scale, column, row));
}
writeFileSync(new URL('charm-sheet-v1.png', root), PNG.sync.write(sheet));
const preview = new PNG({ width: sheet.width * 4, height: sheet.height * 4 });

for (let y = 0; y < preview.height; y++)
  for (let x = 0; x < preview.width; x++) {
    const index = (Math.floor(y / 4) * sheet.width + Math.floor(x / 4)) * 4;

    sheet.data.copy(preview.data, (y * preview.width + x) * 4, index, index + 4);
  }
writeFileSync(new URL('charm-sheet-preview-v1.png', root), PNG.sync.write(preview));
