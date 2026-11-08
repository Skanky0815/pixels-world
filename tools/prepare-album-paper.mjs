import { readFileSync, writeFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import { URL } from 'node:url';
const source = PNG.sync.read(
  readFileSync(new URL('../assets/ui/album/sources/paper-source-v1.png', import.meta.url)),
);
const result = new PNG({ width: 256, height: 256 });
for (let y = 0; y < 256; y++) {
  for (let x = 0; x < 256; x++) {
    const sampleX = Math.min(source.width - 1, Math.floor(((x + 0.5) * source.width) / 256));
    const sampleY = Math.min(source.height - 1, Math.floor(((y + 0.5) * source.height) / 256));
    const sourceOffset = (sampleY * source.width + sampleX) * 4;
    result.data.set(source.data.subarray(sourceOffset, sourceOffset + 4), (y * 256 + x) * 4);
  }
}
writeFileSync(new URL('../assets/ui/album/paper.png', import.meta.url), PNG.sync.write(result));
