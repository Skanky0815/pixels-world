import { URL } from 'node:url';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { PNG } from 'pngjs';

const source = PNG.sync.read(
  readFileSync(new URL('../assets/pixel/pixel-idle-master.png', import.meta.url)),
);
const target = new URL('../public/icons/', import.meta.url);
mkdirSync(target, { recursive: true });

function icon(size, ratio) {
  const image = new PNG({ width: size, height: size });
  const extent = Math.floor(size * ratio),
    offset = Math.floor((size - extent) / 2);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const index = (y * size + x) * 4;
      image.data.set([36, 31, 41, 255], index);
      const sx = Math.floor(((x - offset) * 22) / extent) + 10;
      const sy = Math.floor(((y - offset) * 22) / extent);
      if (x < offset || y < offset || x >= offset + extent || y >= offset + extent) continue;
      const pixel = source.data.subarray(
        (sy * source.width + sx) * 4,
        (sy * source.width + sx) * 4 + 4,
      );
      const alpha = pixel[3] / 255;
      for (let channel = 0; channel < 3; channel++)
        image.data[index + channel] = Math.round(
          pixel[channel] * alpha + image.data[index + channel] * (1 - alpha),
        );
    }
  return PNG.sync.write(image);
}

for (const [name, size, ratio] of [
  ['favicon-32.png', 32, 0.88],
  ['apple-touch-icon.png', 180, 0.8],
  ['pixel-192.png', 192, 0.8],
  ['pixel-512.png', 512, 0.8],
  ['pixel-maskable-512.png', 512, 0.55],
])
  writeFileSync(new URL(name, target), icon(size, ratio));

const small = readFileSync(new URL('favicon-32.png', target)).toString('base64');
writeFileSync(
  new URL('favicon.svg', target),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><defs><clipPath id="corners"><rect width="32" height="32" rx="5"/></clipPath></defs><image width="32" height="32" clip-path="url(#corners)" style="image-rendering:pixelated" href="data:image/png;base64,${small}"/></svg>\n`,
);
