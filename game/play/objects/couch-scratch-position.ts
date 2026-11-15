import type { Bounds } from '../interactions/contracts.ts';

export interface ScratchMark {
  readonly x: number;
  readonly y: number;
}

export function couchScratchScale(width: number) {
  return width >= 188 ? 2 : 1;
}

/** Große Sofas zeigen 28×32-Patches mit vier Pixeln Abstand. */
// eslint-disable-next-line max-lines-per-function -- Kontakt, sortierte Kandidaten und Abstand zu vorhandenen Patches bilden eine zusammenhängende Platzsuche.
export function couchScratchPosition(
  seat: Bounds,
  x: number,
  bottom: number,
  marks: readonly ScratchMark[],
) {
  const scale = couchScratchScale(seat.width);
  const stride = 16 * scale;
  const target = x + (x > seat.x + seat.width / 2 ? -12 : 12);
  const y = bottom > seat.y + seat.height + 2 ? seat.y + seat.height + 10 : seat.y - 39;
  const slots = Array.from(
    { length: Math.floor((seat.width - 14 * scale) / stride) + 1 },
    (_, index) => seat.x + 7 * scale + index * stride,
  );
  const free = slots
    .sort((a, b) => Math.abs(a - target) - Math.abs(b - target))
    .find((candidate) =>
      marks.every(
        (mark) => Math.abs(mark.y - y) >= 16 * scale || Math.abs(mark.x - candidate) >= stride,
      ),
    );

  return free === undefined ? undefined : { x: free, y };
}
