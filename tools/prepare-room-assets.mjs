import { URL } from 'node:url';
import { readFileSync, writeFileSync } from 'node:fs';
import { PNG } from 'pngjs';
const root = new URL('../assets/environment/living-room/', import.meta.url);
const read = (path) => PNG.sync.read(readFileSync(new URL(path, root)));
const save = (name, image) => writeFileSync(new URL(name + '.png', root), PNG.sync.write(image));
const environment = read('sources/environment-approved-v7.png');
const crops = {
  'room-plaster': [40, 50, 128, 128],
  'room-panel': [96, 340, 96, 128],
  'room-floor': [0, 468, 96, 24],
  'room-ceiling': [0, 0, 96, 14],
  'room-picture': [282, 112, 108, 112],
};
for (const [name, [x, y, w, h]] of Object.entries(crops)) {
  const bounds = {
    x: Math.round((x * environment.width) / 960),
    y: Math.round((y * environment.height) / 540),
    width: Math.round((w * environment.width) / 960),
    height: Math.round((h * environment.height) / 540),
  };
  save(name, resample(environment, bounds, w / 2, h / 2));
}
for (const [name, source, width, height] of [
  ['room-window', 'sources/window-source-v7.png', 56, 92],
  ['room-door', 'sources/door-source-v1.png', 56, 108],
  ['room-rug', 'sources/rug-source-v1.png', 215, 15],
]) {
  const image = read(source),
    bounds = alphaBounds(image);
  const scale = Math.min(width / bounds.width, height / bounds.height);
  const content = resample(
    image,
    bounds,
    Math.round(bounds.width * scale),
    Math.round(bounds.height * scale),
  );
  const out = new PNG({ width, height });
  PNG.bitblt(
    content,
    out,
    0,
    0,
    content.width,
    content.height,
    Math.floor((width - content.width) / 2),
    Math.floor((height - content.height) / 2),
  );
  save(name, out);
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
  if (right < 0) throw new Error('No opaque source pixels');
  return { x, y, width: right - x + 1, height: bottom - y + 1 };
}
function resample(source, bounds, width, height) {
  const out = new PNG({ width, height });
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const sx =
        bounds.x + Math.min(bounds.width - 1, Math.floor(((x + 0.5) * bounds.width) / width));
      const sy =
        bounds.y + Math.min(bounds.height - 1, Math.floor(((y + 0.5) * bounds.height) / height));
      const from = (sy * source.width + sx) * 4,
        to = (y * width + x) * 4;
      source.data.copy(out.data, to, from, from + 4);
    }
  return out;
}
