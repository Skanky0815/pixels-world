import sheetUrl from '../../assets/pixel/pixel-sheet.png?url';
import { PIXEL_ANIMATIONS } from '../game/actors/pixel-animations';
import './animation-compare.css';

if (!import.meta.env.DEV) throw new Error('Animationsvergleich ist nur im Dev-Betrieb verfügbar.');

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
const host = document.querySelector('#comparisons');
const pause = document.querySelector<HTMLButtonElement>('#pause');
const step = document.querySelector<HTMLButtonElement>('#step');

if (!host || !pause || !step) throw new Error('Vergleichsansicht unvollständig');
const image = new Image();

image.src = sheetUrl;
await image.decode();
let paused = false,
  elapsed = 0,
  lastTime = performance.now();
const panels: {
  animation: Animation;
  size: number;
  offset: number;
  context: CanvasRenderingContext2D;
  info: HTMLOutputElement;
}[] = [];

for (const initial of ['walk', 'scratch', 'nibble'] as const) {
  const card = document.createElement('article');
  const title = document.createElement('h2');

  title.textContent = names[initial];
  const select = document.createElement('select');

  select.setAttribute('aria-label', `Animation für ${names[initial]}`);

  for (const [value, label] of Object.entries(names)) select.add(new Option(label, value));
  select.value = initial;
  const canvas = document.createElement('canvas');

  canvas.width = 320;
  canvas.height = 220;
  canvas.setAttribute('aria-label', `Idle und ${names[initial]} im Größenvergleich`);
  const context = canvas.getContext('2d');

  if (!context) throw new Error('Canvas nicht verfügbar');
  const label = document.createElement('label');

  label.textContent = 'Zeichenfläche der Pose';
  const size = document.createElement('input');

  size.type = 'range';
  size.min = '48';
  size.max = '120';
  size.step = '1';
  size.value = String(32 * PIXEL_ANIMATIONS[initial].scale);
  size.setAttribute('aria-label', `Vorschaugröße für ${names[initial]}`);
  const info = document.createElement('output');
  const panel = {
    animation: initial as Animation,
    size: Number(size.value),
    offset: 0,
    context,
    info,
  };

  size.addEventListener('input', () => {
    panel.size = Number(size.value);
    draw(panel);
  });
  select.addEventListener('change', () => {
    panel.animation = select.value as Animation;
    panel.size = 32 * PIXEL_ANIMATIONS[panel.animation].scale;
    size.value = String(panel.size);
    title.textContent = names[panel.animation];
    draw(panel);
  });
  label.append(size, info);
  card.append(title, select, canvas, label);
  host.append(card);
  panels.push(panel);
}

// eslint-disable-next-line max-lines-per-function -- Frameauswahl, Referenzsprite und Beschriftung bilden eine gemeinsame Vorschau; die Hintergrundmotive sind separat.
function draw(panel: (typeof panels)[number]) {
  const { context: ctx, animation, size } = panel;
  const config = PIXEL_ANIMATIONS[animation];
  const frame =
    config.frames[
      (Math.floor((elapsed * config.frameRate) / 1000) + panel.offset) % config.frames.length
    ];

  drawBackground(ctx, animation);
  drawReferenceLine(ctx);
  drawSprite(ctx, 0, 76, 64);
  drawSprite(ctx, frame, 218, size);
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
function drawSprite(ctx: CanvasRenderingContext2D, index: number, x: number, width: number) {
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

pause.addEventListener('click', () => {
  paused = !paused;
  pause.textContent = paused ? 'Weiterlaufen' : 'Anhalten';
  step.disabled = !paused;
});
step.addEventListener('click', () => {
  panels.forEach((panel) => {
    panel.offset++;
    draw(panel);
  });
});

function tick(time: number) {
  if (!paused) elapsed += Math.min(time - lastTime, 100);
  lastTime = time;
  panels.forEach(draw);
  requestAnimationFrame(tick);
}

document.documentElement.dataset.ready = 'true';
requestAnimationFrame(tick);
