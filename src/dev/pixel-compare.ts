import sheetUrl from '../../assets/pixel/pixel-sheet.png?url';
import { PIXEL_ANIMATIONS } from '../game/actors/pixel-animations';
import { PreviewPlayback, previewControls } from './preview-playback';

type Animation = keyof typeof PIXEL_ANIMATIONS;
const names: Record<Animation, string> = {
  idle: 'Idle',
  walk: 'Laufen',
  jump: 'Sprung aufwärts',
  apex: 'Sprung am Scheitelpunkt',
  fall: 'Fallen',
  land: 'Landen',
  climb: 'Klettern',
  slide: 'Rutschen',
  scratch: 'Sofa kratzen',
  nibble: 'Knabbern',
};

type Panel = ReturnType<typeof buildPanel>['panel'];

export async function createPixelComparison(host: Element) {
  const image = new Image();

  image.src = sheetUrl;
  await image.decode();
  const { panel, card, abort } = buildPanel(host, image);

  return previewControls(card, 'Pixel', panel.clock, () => draw(panel), abort);
}

// eslint-disable-next-line max-lines-per-function -- Auswahl, Canvas und Größenregler gehören zu genau einer Figur; Listener entstehen einmal und werden gemeinsam abgemeldet.
function buildPanel(host: Element, image: HTMLImageElement) {
  const card = document.createElement('article');
  const title = document.createElement('h3');
  const select = document.createElement('select');
  const canvas = document.createElement('canvas');
  const label = document.createElement('label');
  const size = document.createElement('input');
  const info = document.createElement('output');
  const abort = new AbortController();

  card.dataset.character = 'pixel';
  select.setAttribute('aria-label', 'Pixel-Animation');

  for (const [value, name] of Object.entries(names)) select.add(new Option(name, value));
  select.value = 'walk';
  title.textContent = names.walk;
  canvas.width = 320;
  canvas.height = 220;
  canvas.setAttribute('aria-label', 'Pixel: Idle und gewählte Animation');
  const context = canvas.getContext('2d');

  if (!context) throw new Error('Canvas nicht verfügbar');
  size.type = 'range';
  size.min = '48';
  size.max = '120';
  size.step = '1';
  size.value = String(32 * PIXEL_ANIMATIONS.walk.scale);
  size.setAttribute('aria-label', 'Pixel-Vorschaugröße');
  label.textContent = 'Zeichenfläche der Pose';
  const panel = {
    animation: 'walk' as Animation,
    size: Number(size.value),
    clock: new PreviewPlayback(),
    context,
    info,
    image,
  };

  size.addEventListener(
    'input',
    () => {
      panel.size = Number(size.value);
      draw(panel);
    },
    { signal: abort.signal },
  );
  select.addEventListener(
    'change',
    () => {
      panel.animation = select.value as Animation;
      panel.clock.reset();
      panel.size = 32 * PIXEL_ANIMATIONS[panel.animation].scale;
      size.value = String(panel.size);
      title.textContent = names[panel.animation];
      draw(panel);
    },
    { signal: abort.signal },
  );
  label.append(size, info);
  card.append(title, select, canvas, label);
  host.append(card);

  return { panel, card, abort };
}

// eslint-disable-next-line max-lines-per-function -- Frameauswahl, Referenzsprite und Beschriftung bilden eine gemeinsame Vorschau; die Hintergrundmotive sind separat.
function draw(panel: Panel) {
  const { context: ctx, animation, size } = panel;
  const config = PIXEL_ANIMATIONS[animation];
  const frame = panel.clock.frame(config);

  drawBackground(ctx, animation);
  drawReferenceLine(ctx);
  drawSprite(ctx, panel.image, 0, 76, 64);
  drawSprite(ctx, panel.image, frame, 218, size);
  ctx.fillStyle = '#493b32';
  ctx.font = '12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Idle · 64 px', 76, 204);
  ctx.fillText(`${names[animation]} · ${size} px`, 218, 204);
  panel.info.value = `${size} × ${size} px · Frame ${frame}`;
}

// eslint-disable-next-line max-lines-per-function -- Die kleinen Zeichenfolgen der drei Vorschaukulissen bleiben direkt vergleichbar.
function drawBackground(ctx: CanvasRenderingContext2D, animation: Animation) {
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#cbb192';
  ctx.fillRect(0, 0, 320, 220);
  ctx.fillStyle = '#a68a72';
  ctx.fillRect(0, 118, 320, 102);

  if (animation === 'scratch') {
    ctx.fillStyle = '#687a63';
    ctx.fillRect(18, 137, 284, 30);
    ctx.fillStyle = '#93a184';
    ctx.fillRect(18, 167, 284, 14);
    ctx.fillStyle = '#59443d';
    ctx.fillRect(30, 181, 8, 20);
    ctx.fillRect(282, 181, 8, 20);
  } else if (animation === 'climb' || animation === 'slide') {
    ctx.fillStyle = '#a5654e';
    ctx.fillRect(170, 24, 132, 144);
    ctx.fillStyle = '#bd8060';

    for (let x = 174; x < 300; x += 18) ctx.fillRect(x, 24, 7, 144);
  } else {
    ctx.fillStyle = '#9f7154';
    ctx.fillRect(0, 168, 320, 52);
  }

  if (animation === 'nibble') drawPlant(ctx);
}

// eslint-disable-next-line max-lines-per-function -- Zusammengehörige Zeichenbefehle für Halme und Topf bleiben in einer Routine.
function drawPlant(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = '#596d57';
  ctx.lineWidth = 3;

  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(269 + i * 3, 150);
    ctx.lineTo(264 + i * 5, 126 - (i % 2) * 9);
    ctx.stroke();
  }

  ctx.fillStyle = '#b47655';
  ctx.fillRect(265, 149, 28, 19);
}

function drawReferenceLine(ctx: CanvasRenderingContext2D) {
  // Both reference and action use the same bottom anchor as the game renderer.
  ctx.strokeStyle = '#715040';
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  ctx.moveTo(12, 168);
  ctx.lineTo(308, 168);
  ctx.stroke();
  ctx.setLineDash([]);
}

// eslint-disable-next-line max-lines-per-function -- Ein einzelner drawImage-Aufruf hat neun ausgeschriebene Koordinatenparameter.
function drawSprite(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  index: number,
  x: number,
  width: number,
) {
  ctx.drawImage(
    image,
    (index % 5) * 32,
    Math.floor(index / 5) * 32,
    32,
    32,
    x - width / 2,
    168 - width,
    width,
    width,
  );
}
