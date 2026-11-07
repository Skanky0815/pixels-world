import { URL } from 'node:url';
import { readFileSync, writeFileSync } from 'node:fs';
import { PNG } from 'pngjs';
const root = new URL('../assets/objects/couch/', import.meta.url);
function bounds(p) {
  let l = p.width,
    t = p.height,
    r = -1,
    b = -1;
  for (let y = 0; y < p.height; y++)
    for (let x = 0; x < p.width; x++)
      if (p.data[(y * p.width + x) * 4 + 3] >= 192) {
        l = Math.min(l, x);
        t = Math.min(t, y);
        r = Math.max(r, x);
        b = Math.max(b, y);
      }
  return { l, t, r, b };
}
for (const name of ['cozy', 'worn', 'scratch']) {
  const p = PNG.sync.read(
    readFileSync(new URL(`sources/${name}-source-${name === 'scratch' ? 'v2' : 'v3'}.png`, root)),
  );
  const b = bounds(p);
  const w = name === 'scratch' ? 14 : 136,
    h = name === 'scratch' ? 16 : 80;
  const out = new PNG({ width: w, height: h });
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const sx = b.l + Math.min(b.r - b.l, Math.floor(((x + 0.5) * (b.r - b.l + 1)) / w));
      const ratio =
        name === 'scratch'
          ? (y + 0.5) / h
          : y < 30
            ? ((y + 0.5) / 30) * 0.535
            : 0.535 + ((y - 30 + 0.5) / 50) * 0.465;
      const sy = b.t + Math.min(b.b - b.t, Math.floor(ratio * (b.b - b.t + 1)));
      const i = (sy * p.width + sx) * 4;
      p.data.copy(out.data, (y * w + x) * 4, i, i + 4);
    }
  writeFileSync(new URL(`couch-${name}.png`, root), PNG.sync.write(out));
}
