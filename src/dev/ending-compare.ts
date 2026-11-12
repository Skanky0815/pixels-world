import { PreviewPlayback, previewControls } from './preview-playback';
import saraUrl from '../../assets/sara/sara-sheet-v1.png?url';
import endingUrl from '../../assets/sara/ending-v1/ending-sheet-v1.png?url';
import pixelUrl from '../../assets/pixel/pixel-sheet.png?url';
import charmUrl from '../../assets/pixel/charm-v1/charm-sheet-v1.png?url';

import { SARA_ENDINGS } from '../game/actors/sara-endings';

const MODES = Object.entries(SARA_ENDINGS).map(([key, clip]) => ({ ...clip, key }));

type Mode = (typeof MODES)[number];
type Images = Awaited<ReturnType<typeof images>>;

export async function createEndingComparisons(host: Element) {
  const art = await images();

  return MODES.map((mode) => card(host, mode, art));
}

function images() {
  return Promise.all(
    [saraUrl, endingUrl, pixelUrl, charmUrl].map(async (url) => {
      const image = new Image();

      image.src = url;
      await image.decode();

      return image;
    }),
  );
}

// eslint-disable-next-line max-lines-per-function -- Jede gemeinsame Pose besitzt Vorschauuhr, ruhigen Modus und eine aufräumbare Toolbar.
function card(host: Element, mode: Mode, art: Images) {
  const root = document.createElement('article');
  const canvas = document.createElement('canvas');
  const title = document.createElement('h3');
  const label = document.createElement('label');
  const reduced = document.createElement('input');
  const info = document.createElement('output');
  const clock = new PreviewPlayback();
  const abort = new AbortController();

  root.dataset.ending = mode.key;
  title.textContent = mode.label;
  canvas.width = 320;
  canvas.height = 250;
  canvas.setAttribute('aria-label', mode.label);
  reduced.type = 'checkbox';
  reduced.checked = matchMedia('(prefers-reduced-motion: reduce)').matches;
  reduced.setAttribute('aria-label', `${mode.label}: ruhige Endpose`);
  label.className = 'ending-reduced';
  label.append(reduced, 'Ruhige Endpose');
  root.append(title, canvas, label, info);
  host.append(root);
  const context = canvas.getContext('2d');

  if (!context) throw new Error('Abschlussvorschau: Canvas fehlt');
  const draw = () =>
    render(
      context,
      art,
      mode,
      reduced.checked ? (mode.frames.at(-1) ?? 0) : clock.frame(mode),
      info,
    );

  reduced.addEventListener('change', draw, { signal: abort.signal });
  const controls = previewControls(root, mode.label, clock, draw, abort);

  draw();

  return controls;
}

// eslint-disable-next-line max-lines-per-function -- Beide Figuren, Vergleichssilhouette und Pfotenlinie werden in derselben logischen Spielgeometrie gezeichnet.
function render(
  ctx: CanvasRenderingContext2D,
  art: Images,
  mode: Mode,
  frame: number,
  info: HTMLOutputElement,
) {
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#cbb192';
  ctx.fillRect(0, 0, 320, 250);
  ctx.fillStyle = '#9f7154';
  ctx.fillRect(0, 190, 320, 60);
  ctx.strokeStyle = '#715040';
  ctx.beginPath();
  ctx.moveTo(8, 190);
  ctx.lineTo(312, 190);
  ctx.stroke();
  ctx.drawImage(art[0], 0, 0, 64, 96, 18, 10, 128, 192);
  drawPixel(ctx, art, mode, frame);
  ctx.drawImage(art[1], (frame % 6) * 96, Math.floor(frame / 6) * 96, 96, 96, 149, 10, 192, 192);
  ctx.fillStyle = '#493b32';
  ctx.font = '11px monospace';
  ctx.fillText('Idle-Master', 25, 221);
  ctx.fillText('Pixel + Sara · 2×', 160, 238);
  ctx.canvas.dataset.frame = String(frame);
  info.value = `Frame ${frame} · ${mode.frameRate} FPS · Entwurf #274`;
}

function drawPixel(ctx: CanvasRenderingContext2D, art: Images, mode: Mode, frame: number) {
  if (mode.key === 'belly') {
    const pixelFrame = frame < 2 ? 6 : frame < 3 ? 7 : 8;

    ctx.drawImage(art[3], (pixelFrame % 6) * 48, 48, 48, 48, 144, 94, 96, 96);
  } else ctx.drawImage(art[2], 0, 0, 32, 32, 153, 126, 64, 64);
}
