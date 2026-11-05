import saraUrl from '../../assets/sara/sara-sheet-v1.png?url';
import pixelUrl from '../../assets/pixel/pixel-sheet.png?url';
import { SARA_CLIPS, SARA_SPRITE } from '../game/actors/sara-animations';
import type { SaraAnimation } from '../game/domain/homecoming';

const names: Record<SaraAnimation, string> = {
  'sara-idle': 'Stehen / Blinzeln',
  'sara-enter': 'Hereinkommen',
  'sara-react-calm': 'Skeptischer Blick',
  'sara-react-annoyed': 'Genervte Geste',
  'sara-react-angry': 'Fassungslos',
};

type Panel = ReturnType<typeof buildPanel>;

// eslint-disable-next-line max-lines-per-function -- Gemeinsames Laden und die beiden synchronisierten Vorschauoperationen bleiben als kleiner Controller zusammen.
export async function createSaraComparisons(host: Element) {
  const [sara, pixel] = await Promise.all([loadImage(saraUrl), loadImage(pixelUrl)]);
  const panels = (Object.keys(names) as SaraAnimation[]).map((key) => buildPanel(host, key));

  return {
    draw: (elapsed: number) => panels.forEach((panel) => draw(panel, sara, pixel, elapsed)),
    step: () =>
      panels.forEach((panel) => {
        panel.offset++;
      }),
  };
}

async function loadImage(url: string) {
  const image = new Image();

  image.src = url;
  await image.decode();

  return image;
}

// eslint-disable-next-line max-lines-per-function -- Eine Vorschaukarte hält Titel, Auswahl, Canvas und Regler als gemeinsamen deklarativen Aufbau zusammen.
function buildPanel(host: Element, initial: SaraAnimation) {
  const card = document.createElement('article');
  const title = document.createElement('h3');
  const select = document.createElement('select');
  const canvas = document.createElement('canvas');
  const label = document.createElement('label');
  const size = document.createElement('input');
  const info = document.createElement('output');

  title.textContent = names[initial];
  select.setAttribute('aria-label', `Sara-Animation für ${names[initial]}`);

  for (const [key, name] of Object.entries(names)) select.add(new Option(name, key));
  select.value = initial;
  canvas.width = 320;
  canvas.height = 250;
  canvas.setAttribute('aria-label', `Sara und Pixel: ${names[initial]}`);
  const context = canvas.getContext('2d');

  if (!context) throw new Error('Sara-Vorschau: Canvas fehlt');
  size.type = 'range';
  size.min = '1';
  size.max = '2.5';
  size.step = '0.25';
  size.value = String(SARA_SPRITE.scale);
  size.setAttribute('aria-label', `Sara-Vorschaugröße für ${names[initial]}`);
  label.textContent = 'Skalierung der Pose · Spielwert: 2×';
  const panel = { key: initial, scale: SARA_SPRITE.scale as number, offset: 0, context, info };

  select.addEventListener('change', () => {
    panel.key = select.value as SaraAnimation;
    panel.offset = 0;
    title.textContent = names[panel.key];
  });
  size.addEventListener('input', () => {
    panel.scale = Number(size.value);
  });
  label.append(size, info);
  card.append(title, select, canvas, label);
  host.append(card);

  return panel;
}

// eslint-disable-next-line max-lines-per-function -- Referenzlinie, drei Figuren und ihre Beschriftungen bilden einen zusammenhängenden Größenvergleich.
function draw(panel: Panel, sara: HTMLImageElement, pixel: HTMLImageElement, elapsed: number) {
  const ctx = panel.context;
  const clip = SARA_CLIPS[panel.key];
  const frame =
    clip.frames[
      (Math.floor((elapsed * clip.frameRate) / 1000) + panel.offset) % clip.frames.length
    ];

  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#cbb192';
  ctx.fillRect(0, 0, 320, 250);
  ctx.fillStyle = '#9f7154';
  ctx.fillRect(0, 190, 320, 60);
  ctx.strokeStyle = '#715040';
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  ctx.moveTo(8, 190);
  ctx.lineTo(312, 190);
  ctx.stroke();
  ctx.setLineDash([]);
  drawSara(ctx, sara, 0, 62, SARA_SPRITE.scale);
  ctx.drawImage(pixel, 0, 0, 32, 32, 122, 190 - 64, 64, 64);
  drawSara(ctx, sara, frame, 244, panel.scale);
  ctx.fillStyle = '#493b32';
  ctx.font = '11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Sara · Idle 2×', 62, 218);
  ctx.fillText('Pixel · 2×', 154, 238);
  ctx.fillText(`Pose · ${panel.scale}×`, 244, 218);
  panel.info.value = `${panel.key} · Frame ${frame} · ${clip.frameRate} FPS · ${panel.scale}×`;
}

// eslint-disable-next-line max-lines-per-function -- Frameausschnitt und gemeinsamer Fußanker bleiben in einem vollständigen drawImage-Aufruf sichtbar.
function drawSara(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  frame: number,
  x: number,
  scale: number,
) {
  const { frameWidth: w, frameHeight: h, columns, origin } = SARA_SPRITE;

  ctx.drawImage(
    image,
    (frame % columns) * w,
    Math.floor(frame / columns) * h,
    w,
    h,
    x - w * scale * origin.x,
    190 - h * scale * origin.y,
    w * scale,
    h * scale,
  );
}
