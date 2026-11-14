import { readFileSync, writeFileSync, rmSync, renameSync, mkdirSync, copyFileSync } from 'node:fs';
import { URL, fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { log } from 'node:console';
import { PNG } from 'pngjs';

const root = new URL('../assets/community/slack-v1/', import.meta.url);
const names = [
  'pixel_approved',
  'pixel_chaos',
  'pixel_war_nicht_ich',
  'pixel_love',
  'pixel_in_progress',
  'pixel_question',
  'pixel_idee',
  'pixel_urlaub',
];
const alphaThreshold = 192;

function bounds(image) {
  let left = image.width,
    right = -1,
    top = image.height,
    bottom = -1;
  for (let y = 0; y < image.height; y++)
    for (let x = 0; x < image.width; x++) {
      if (image.data[(y * image.width + x) * 4 + 3] < alphaThreshold) continue;
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    }
  if (right < left) throw new Error('Emoji source is empty');
  return { left, top, width: right - left + 1, height: bottom - top + 1 };
}

function exportEmoji(name) {
  const image = PNG.sync.read(readFileSync(new URL(`sources/${name}.png`, root)));
  const box = bounds(image);
  // One logical pixel becomes two export pixels of transparent safety margin.
  const scale = 62 / Math.max(box.width, box.height);
  const width = Math.round(box.width * scale),
    height = Math.round(box.height * scale);
  const left = Math.floor((64 - width) / 2),
    top = Math.floor((64 - height) / 2);
  const output = new PNG({ width: 128, height: 128 });
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const sx = box.left + Math.min(box.width - 1, Math.floor(((x + 0.5) * box.width) / width));
      const sy = box.top + Math.min(box.height - 1, Math.floor(((y + 0.5) * box.height) / height));
      const source = (sy * image.width + sx) * 4;
      if (image.data[source + 3] < alphaThreshold) continue;
      for (let dy = 0; dy < 2; dy++)
        for (let dx = 0; dx < 2; dx++) {
          const target = (((top + y) * 2 + dy) * 128 + (left + x) * 2 + dx) * 4;
          output.data.set([...image.data.subarray(source, source + 3), 255], target);
        }
    }
  const png = PNG.sync.write(output);
  if (png.length >= 128 * 1024)
    throw new Error(`Emoji ${name} exceeds Slack's size recommendation`);
  writeFileSync(new URL(`${name}.png`, root), png);
  log(`${name}: 128×128, ${png.length} bytes, binary alpha`);
  return png.toString('base64');
}

const images = names.map(exportEmoji);
const html = `<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pixel-Slack-Emojis · Größenprobe</title><style>
*{box-sizing:border-box}body{margin:0;padding:24px;background:#241f29;color:#f4e4c6;font:16px/1.4 system-ui,sans-serif}h1{font-size:25px;margin:0 0 8px}p{margin:0 0 24px;color:#d1b596}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px}article{border:1px solid #776354;border-radius:8px;overflow:hidden}h2{font:12px monospace;margin:12px;overflow-wrap:anywhere}.row{display:flex;align-items:center;justify-content:space-evenly;gap:8px;padding:16px}.light{background:#fff;color:#241f29}.dark{background:#241f29}img{image-rendering:pixelated}.sizes img{image-rendering:auto}.large{height:160px}.sizes{height:76px}small{color:inherit}a{color:#edc37c}@media(max-width:580px){.grid{grid-template-columns:1fr}}
</style><h1>Pixel-Slack-Emojis</h1><p>Originalexport 128 px · darunter Größenprobe mit 32 und 22 px auf hellem und dunklem Grund.</p><div class="grid">${names.map((name, i) => `<article><h2>:${name}:</h2><div class="row dark large"><img src="data:image/png;base64,${images[i]}" width="128" height="128" alt="${name}"></div>${['light', 'dark'].map((theme) => `<div class="row sizes ${theme}"><img src="data:image/png;base64,${images[i]}" width="32" height="32" alt="${name} mit 32 Pixeln"><img src="data:image/png;base64,${images[i]}" width="22" height="22" alt="${name} mit 22 Pixeln"></div>`).join('')}</article>`).join('')}</div><p style="margin-top:20px"><a href="pixel-slack-emojis.zip">ZIP herunterladen</a></p></html>`;
writeFileSync(new URL('preview.html', root), html);
writeFileSync(
  new URL('Namen.txt', root),
  'Pixel Slack Emojis\n\n' +
    names.map((name) => `${name}.png  ->  :${name}:`).join('\n') +
    '\n\nZIP entpacken. In Slack im Emoji-Menü „Emoji hinzufügen“ öffnen, jeweils die PNG auswählen und den Namen vergeben.\n',
);
const zip = fileURLToPath(new URL('pixel-slack-emojis.zip', root));
const pendingZip = fileURLToPath(new URL('pixel-slack-emojis.tmp.zip', root));
rmSync(pendingZip, { force: true });
execFileSync(
  'zip',
  ['-q', '-X', '-j', pendingZip, ...names.map((name) => `${name}.png`), 'Namen.txt'],
  {
    cwd: fileURLToPath(root),
  },
);

renameSync(pendingZip, zip);

const downloads = new URL('../public/downloads/', import.meta.url);
const previews = new URL('pixel-slack-emojis/', downloads);
mkdirSync(previews, { recursive: true });
for (const name of names)
  copyFileSync(new URL(`${name}.png`, root), new URL(`${name}.png`, previews));
copyFileSync(zip, new URL('pixel-slack-emojis.zip', downloads));
