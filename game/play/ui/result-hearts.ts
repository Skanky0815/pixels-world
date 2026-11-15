import type Phaser from 'phaser';

/** One outline for canvas and DOM; fill never changes its geometry. */
const points = [
  { x: 2, y: 1 },
  { x: 6, y: 1 },
  { x: 8, y: 3 },
  { x: 10, y: 1 },
  { x: 14, y: 1 },
  { x: 16, y: 3 },
  { x: 16, y: 7 },
  { x: 8, y: 15 },
  { x: 0, y: 7 },
  { x: 0, y: 3 },
];
const svgNamespace = 'http://www.w3.org/2000/svg';

// eslint-disable-next-line max-lines-per-function -- Dieselbe Kontur wird pro Herz gezeichnet; nur die Füllung hängt vom Fortschritt ab.
export function drawResultHearts(
  graphics: Phaser.GameObjects.Graphics,
  earned: number,
  required: number,
  color: number,
) {
  graphics.clear().lineStyle(1, color).fillStyle(color);

  for (let index = 0; index < required; index++) {
    const outline = points.map(({ x, y }) => ({ x: x + index * 20, y }));

    if (index < earned) graphics.fillPoints(outline, true);
    graphics.strokePoints(outline, true, true);
  }
}

// eslint-disable-next-line max-lines-per-function -- Ein SVG hält feste Außenmaße und dieselbe Kontur für beide Füllzustände.
export function resultHeartIcon(filled: boolean) {
  const svg = document.createElementNS(svgNamespace, 'svg');
  const polygon = document.createElementNS(svgNamespace, 'polygon');

  svg.setAttribute('viewBox', '-1 0 18 17');
  svg.setAttribute('aria-hidden', 'true');
  svg.dataset.filled = String(filled);
  polygon.setAttribute('points', points.map(({ x, y }) => `${x},${y}`).join(' '));
  polygon.setAttribute('fill', filled ? 'currentColor' : 'none');
  polygon.setAttribute('stroke', 'currentColor');
  svg.append(polygon);

  return svg;
}
