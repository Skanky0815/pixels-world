export type FocusDirection = 'up' | 'down' | 'left' | 'right';
export interface FocusBounds {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

/** Clamp at the edge; spatial navigation follows rendered rows and columns. */
// eslint-disable-next-line max-lines-per-function -- Leere Ansicht, Einstieg und beide Navigationsformen teilen denselben begrenzten Indexvertrag.
export function nextFocusIndex(
  bounds: readonly FocusBounds[],
  current: number,
  direction: FocusDirection,
  spatial = false,
) {
  if (!bounds.length) return -1;

  if (current < 0) return 0;

  if (!spatial) return linearIndex(bounds.length, current, direction);

  return spatialIndex(bounds, current, direction);
}

function linearIndex(length: number, current: number, direction: FocusDirection) {
  if (direction === 'left' || direction === 'right') return current;

  return Math.max(0, Math.min(length - 1, current + (direction === 'down' ? 1 : -1)));
}

function spatialIndex(bounds: readonly FocusBounds[], current: number, direction: FocusDirection) {
  const origin = bounds[current];
  const candidates = bounds.map((rect, index) => ({
    index,
    rank: spatialRank(origin, rect, direction),
  }));
  const next = candidates.filter((item) => item.rank !== null).sort(compareRank)[0];

  return next?.index ?? current;
}

function compareRank(a: { rank: readonly number[] | null }, b: { rank: readonly number[] | null }) {
  if (!a.rank || !b.rank) return 0;

  return a.rank[0] - b.rank[0] || a.rank[1] - b.rank[1] || a.rank[2] - b.rank[2];
}

// eslint-disable-next-line max-lines-per-function -- Richtungsfilter und geometrische Rangfolge verwenden dieselbe aktuelle Ansicht ohne feste Spaltenzahl.
function spatialRank(origin: FocusBounds, rect: FocusBounds, direction: FocusDirection) {
  const horizontal = direction === 'left' || direction === 'right';
  const forward = direction === 'right' || direction === 'down' ? 1 : -1;
  const [axis, size, cross, crossSize] = horizontal
    ? (['left', 'width', 'top', 'height'] as const)
    : (['top', 'height', 'left', 'width'] as const);
  const along = (center(rect[axis], rect[size]) - center(origin[axis], origin[size])) * forward;
  const across = intervalGap(origin[cross], origin[crossSize], rect[cross], rect[crossSize]);

  if (along <= 1 || (horizontal && across > 0)) return null;

  return [
    across,
    along,
    Math.abs(center(rect[cross], rect[crossSize]) - center(origin[cross], origin[crossSize])),
  ] as const;
}

function intervalGap(a: number, aSize: number, b: number, bSize: number) {
  return Math.max(0, a - b - bSize, b - a - aSize);
}

function center(start: number, size: number) {
  return start + size / 2;
}
