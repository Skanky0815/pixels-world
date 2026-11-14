import { URL } from 'node:url';
import { readFileSync, writeFileSync } from 'node:fs';
import { PNG } from 'pngjs';
const root = new URL('../assets/objects/herbs/', import.meta.url);

function bounds(source, start, end, startY = 0) {
  let left = end,
    top = source.height,
    right = start,
    bottom = 0;
  for (let y = Math.floor(startY); y < source.height; y++)
    for (let x = start; x < end; x++)
      if (source.data[(y * source.width + x) * 4 + 3] >= 192) {
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }
  if (right <= left) throw new Error('Empty herb frame');
  return { left, top, right, bottom, width: right - left + 1, height: bottom - top + 1 };
}

function exportFrame(source, box, fullHeight, width, scale) {
  const output = new PNG({ width: 40, height: 60 });
  const logicalWidth = Math.round(width * scale),
    logicalHeight = Math.round(fullHeight * scale);
  const left = Math.floor((20 - logicalWidth) / 2),
    top = 30 - logicalHeight;
  const sourceLeft = box.center - width / 2;
  const sourceTop = box.bottom + 1 - fullHeight;
  for (let y = 0; y < logicalHeight; y++)
    for (let x = 0; x < logicalWidth; x++) {
      const sx = Math.floor(sourceLeft + ((x + 0.5) * width) / logicalWidth);
      const sy = Math.floor(sourceTop + ((y + 0.5) * fullHeight) / logicalHeight);
      const index = (sy * source.width + sx) * 4;
      if (source.data[index + 3] < 192) continue;
      for (let dy = 0; dy < 2; dy++)
        for (let dx = 0; dx < 2; dx++) {
          const offset = (((top + y) * 2 + dy) * 40 + (left + x) * 2 + dx) * 4;
          output.data.set([...source.data.subarray(index, index + 3), 255], offset);
        }
    }
  return output;
}

for (const name of ['basil', 'parsley', 'mint']) {
  const source = PNG.sync.read(readFileSync(new URL(`sources/${name}-source-v1.png`, root)));
  const frames = [
    bounds(source, 0, source.width / 2),
    bounds(source, source.width / 2, source.width),
  ];
  for (const [index, frame] of frames.entries()) {
    const pot = bounds(
      source,
      (index * source.width) / 2,
      ((index + 1) * source.width) / 2,
      frame.bottom - frame.height * 0.15,
    );
    frame.center = (pot.left + pot.right + 1) / 2;
  }
  const width = Math.max(...frames.map((b) => b.width));
  const height = Math.max(...frames.map((b) => b.height));
  const scale = Math.min(19 / width, 28 / height);
  for (const [index, state] of ['intact', 'bitten'].entries())
    writeFileSync(
      new URL(`${name}-${state}.png`, root),
      PNG.sync.write(exportFrame(source, frames[index], height, width, scale)),
    );
}
