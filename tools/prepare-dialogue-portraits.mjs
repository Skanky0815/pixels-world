import { readFileSync, writeFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import { URL } from 'node:url';

// Same nearest-neighbour sampling as the landing-page portrait exporter.
const root = new URL('../assets/dialogue-portraits/', import.meta.url);
const size = 128;

for (const expression of ['annoyed', 'surprised', 'friendly']) {
  const source = PNG.sync.read(
    readFileSync(new URL(`sources/sara-${expression}-draft-v1.png`, root)),
  );
  const output = new PNG({ width: size, height: size });

  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const sx = Math.min(source.width - 1, Math.floor(((x + 0.5) * source.width) / size));
      const sy = Math.min(source.height - 1, Math.floor(((y + 0.5) * source.height) / size));
      const offset = (sy * source.width + sx) * 4;

      source.data.copy(output.data, (y * size + x) * 4, offset, offset + 4);
    }

  writeFileSync(new URL(`sara-${expression}-v1.png`, root), PNG.sync.write(output));
}
