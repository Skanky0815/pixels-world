import { URL } from 'node:url';
import { readFileSync, writeFileSync } from 'node:fs';
import { PNG } from 'pngjs';

const root = new URL('../assets/objects/pictures/', import.meta.url);
for (const motif of ['pixel', 'berlin', 'cozy']) {
  const source = PNG.sync.read(readFileSync(new URL(`sources/${motif}-source-v1.png`, root)));
  const box = alphaBounds(source);
  const scale = Math.min(52 / box.width, 54 / box.height);
  const width = Math.round(box.width * scale),
    height = Math.round(box.height * scale);
  const output = new PNG({ width: 54, height: 56 });
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const sx = box.x + Math.min(box.width - 1, Math.floor(((x + 0.5) * box.width) / width));
      const sy = box.y + Math.min(box.height - 1, Math.floor(((y + 0.5) * box.height) / height));
      const offset = (sy * source.width + sx) * 4;
      const target =
        ((y + Math.floor((56 - height) / 2)) * 54 + x + Math.floor((54 - width) / 2)) * 4;
      source.data.copy(output.data, target, offset, offset + 4);
    }
  writeFileSync(new URL(`picture-${motif}.png`, root), PNG.sync.write(output));
}
function alphaBounds(image) {
  let x = image.width,
    y = image.height,
    right = -1,
    bottom = -1;
  for (let row = 0; row < image.height; row++)
    for (let col = 0; col < image.width; col++)
      if (image.data[(row * image.width + col) * 4 + 3] >= 192) {
        x = Math.min(x, col);
        y = Math.min(y, row);
        right = Math.max(right, col);
        bottom = Math.max(bottom, row);
      }
  if (right < x) throw new Error('Empty picture source');
  return { x, y, width: right - x + 1, height: bottom - y + 1 };
}
