import { readFileSync, writeFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import { URL } from 'node:url';
const root = new URL('../assets/objects/shelves/', import.meta.url);
function exportSource(name, width, height) {
  const src = PNG.sync.read(readFileSync(new URL(`sources/${name}-source-v1.png`, root)));
  let l = src.width,
    t = src.height,
    r = -1,
    b = -1;
  for (let y = 0; y < src.height; y++)
    for (let x = 0; x < src.width; x++)
      if (src.data[(y * src.width + x) * 4 + 3] >= 192) {
        l = Math.min(l, x);
        t = Math.min(t, y);
        r = Math.max(r, x);
        b = Math.max(b, y);
      }
  if (r < l) throw new Error('Empty shelf source');
  const out = new PNG({ width, height });
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const sx = l + Math.min(r - l, Math.floor(((x + 0.5) * (r - l + 1)) / width));
      const sy = t + Math.min(b - t, Math.floor(((y + 0.5) * (b - t + 1)) / height));
      const i = (sy * src.width + sx) * 4;
      src.data.copy(out.data, (y * width + x) * 4, i, i + 4);
    }
  return out;
}
const board = exportSource('board', 48, 8),
  bracket = exportSource('bracket', 4, 10);
for (const [name, x] of [
  ['left', 0],
  ['center', 24],
  ['right', 40],
]) {
  const out = new PNG({ width: 8, height: 8 });
  for (let y = 0; y < 8; y++)
    board.data.copy(out.data, y * 8 * 4, (y * 48 + x) * 4, (y * 48 + x + 8) * 4);
  writeFileSync(new URL(`shelf-${name}.png`, root), PNG.sync.write(out));
}
writeFileSync(new URL('shelf-bracket.png', root), PNG.sync.write(bracket));

writeFileSync(new URL('shelf-break.png', root), PNG.sync.write(exportSource('break', 8, 8)));
