import { readFileSync, writeFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import { URL } from 'node:url';
const root = new URL('../assets/objects/curtain/', import.meta.url);
for (const [name, w, h] of [
  ['curtain', 56, 178],
  ['tear', 12, 20],
]) {
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
  const scale = Math.min(w / (r - l + 1), h / (b - t + 1));
  const fw = Math.round((r - l + 1) * scale),
    fh = Math.round((b - t + 1) * scale);
  const ox = Math.floor((w - fw) / 2),
    oy = Math.floor((h - fh) / 2);
  const out = new PNG({ width: w, height: h });
  for (let y = 0; y < fh; y++)
    for (let x = 0; x < fw; x++) {
      const sx = l + Math.min(r - l, Math.floor(((x + 0.5) * (r - l + 1)) / fw)),
        sy = t + Math.min(b - t, Math.floor(((y + 0.5) * (b - t + 1)) / fh));
      const i = (sy * src.width + sx) * 4;
      src.data.copy(out.data, ((y + oy) * w + x + ox) * 4, i, i + 4);
    }
  writeFileSync(
    new URL(name === 'curtain' ? 'curtain-rust.png' : 'curtain-tear.png', root),
    PNG.sync.write(out),
  );
}
