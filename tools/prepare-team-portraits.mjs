import { readFileSync, writeFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import { URL } from 'node:url';
const root = new URL('../assets/team/', import.meta.url);
const size = 128;

function portrait(source) {
  const output = new PNG({ width: size, height: size });

  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) sample(source, output, x, y);

  return output;
}

function sample(source, output, x, y) {
  const sx = Math.min(source.width - 1, Math.floor(((x + 0.5) * source.width) / size));
  const sy = Math.min(source.height - 1, Math.floor(((y + 0.5) * source.height) / size));
  const offset = (sy * source.width + sx) * 4;

  source.data.copy(output.data, (y * size + x) * 4, offset, offset + 4);
}

for (const [name, version] of Object.entries({ rico: 'v1', sara: 'v1', pixel: 'v3' })) {
  const source = PNG.sync.read(readFileSync(new URL(`${name}-source-${version}.png`, root)));

  writeFileSync(new URL(`${name}-portrait-${version}.png`, root), PNG.sync.write(portrait(source)));
}
