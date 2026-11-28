import type { Bounds } from '../interactions/contracts.ts';

export interface TearMark {
  readonly x: number;
  readonly y: number;
}

export function curtainTearSize(area: Bounds, maximumMarks = 1) {
  const normal = { width: Math.min(24, area.width), height: Math.min(40, area.height) };
  const capacity =
    Math.floor((area.width + 4) / (normal.width + 4)) *
    Math.floor((area.height + 4) / (normal.height + 4));

  if (capacity >= maximumMarks) return normal;

  return fittedTearSize(area, maximumMarks);
}

function fittedTearSize(area: Bounds, maximumMarks: number) {
  const columns = Math.ceil(Math.sqrt((maximumMarks * area.width) / area.height));
  const rows = Math.ceil(maximumMarks / columns);

  return {
    width: Math.max(2, 2 * Math.floor((area.width - (columns - 1) * 4) / columns / 2)),
    height: Math.max(2, 2 * Math.floor((area.height - (rows - 1) * 4) / rows / 2)),
  };
}

function tearSlots(area: Bounds, maximumMarks: number) {
  const { width, height } = curtainTearSize(area, maximumMarks);
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
  maximumMarks = 1,
) {
  const side = x > area.x + area.width / 2 ? -1 : 1;
  const target = { x: x + side * 48, y: y - 14 };
  const distance = (point: TearMark) => (point.x - target.x) ** 2 + (point.y - target.y) ** 2;

  return tearSlots(area, maximumMarks)
    .sort((a, b) => distance(a) - distance(b))
    .find((slot) => !marks.some((mark) => mark.x === slot.x && mark.y === slot.y));
}
