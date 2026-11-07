import type { Bounds } from '../interactions/contracts.ts';

export interface TearMark {
  readonly x: number;
  readonly y: number;
}

export function curtainTearSize(area: Bounds) {
  return { width: Math.min(24, area.width), height: Math.min(40, area.height) };
}

function tearSlots(area: Bounds) {
  const { width, height } = curtainTearSize(area);
  const columns = Math.floor((area.width + 4) / (width + 4));
  const rows = Math.floor((area.height + 4) / (height + 4));

  return Array.from({ length: columns * rows }, (_, index) => ({
    x: area.x + width / 2 + (index % columns) * (width + 4),
    y: area.y + Math.floor(index / columns) * (height + 4),
  }));
}

// eslint-disable-next-line max-lines-per-function -- Kontaktziel und nächster freier Slot bilden eine zusammenhängende, begrenzte Platzsuche.
export function curtainTearPosition(
  area: Bounds,
  x: number,
  y: number,
  marks: readonly TearMark[],
) {
  const side = x > area.x + area.width / 2 ? -1 : 1;
  const target = { x: x + side * 48, y: y - 14 };
  const distance = (point: TearMark) => (point.x - target.x) ** 2 + (point.y - target.y) ** 2;

  return tearSlots(area)
    .sort((a, b) => distance(a) - distance(b))
    .find((slot) => !marks.some((mark) => mark.x === slot.x && mark.y === slot.y));
}
