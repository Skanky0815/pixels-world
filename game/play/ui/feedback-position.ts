interface Size {
  readonly width: number;
  readonly height: number;
}
interface Anchor {
  readonly x: number;
  readonly top: number;
  readonly bottom: number;
}
export interface FeedbackObstacle extends Size {
  readonly left: number;
  readonly top: number;
}

/** CSS-pixel placement stays inside the visible canvas, even while the stack lifts. */
// eslint-disable-next-line max-lines-per-function -- Die endliche Kandidatenmenge verbindet Anker, Canvasrand und dynamische Overlaygrenzen.
export function feedbackPosition(
  anchor: Anchor,
  message: Size,
  canvas: Size,
  lift: number,
  obstacles: readonly FeedbackObstacle[] = [],
) {
  const margin = 8 + lift;
  const above = anchor.top - message.height - 12;
  const preferred = {
    left: clamp(anchor.x - message.width / 2, 8, canvas.width - message.width - 8),
    top: clamp(
      above >= margin ? above : anchor.bottom + 12,
      margin,
      canvas.height - message.height - 8,
    ),
  };
  const xs = [preferred.left, 8, canvas.width - message.width - 8];
  const ys = [preferred.top, margin, canvas.height - message.height - 8];

  for (const obstacle of obstacles) {
    xs.push(obstacle.left - message.width - 8, obstacle.left + obstacle.width + 8);
    ys.push(obstacle.top - message.height - 8, obstacle.top + obstacle.height + margin);
  }

  const candidates = xs.flatMap((left) =>
    ys.map((top) => ({
      left: clamp(left, 8, canvas.width - message.width - 8),
      top: clamp(top, margin, canvas.height - message.height - 8),
    })),
  );
  const cost = (position: typeof preferred) =>
    feedbackOverlap(position, message, obstacles, lift) * 1e6 +
    Math.hypot(position.left - preferred.left, position.top - preferred.top);

  return candidates.reduce(
    (best, candidate) => (cost(candidate) < cost(best) ? candidate : best),
    preferred,
  );
}

/** Include the full lift range so independent fades cannot move text into an overlay. */
// eslint-disable-next-line max-lines-per-function -- Der vollständige Hubbereich und jedes dynamische Rechteck teilen dieselbe Überschneidungsrechnung.
export function feedbackOverlap(
  position: { readonly left: number; readonly top: number },
  message: Size,
  obstacles: readonly FeedbackObstacle[],
  lift: number,
) {
  return obstacles.reduce((area, obstacle) => {
    const width =
      Math.min(position.left + message.width, obstacle.left + obstacle.width) -
      Math.max(position.left, obstacle.left);
    const height =
      Math.min(position.top + message.height, obstacle.top + obstacle.height) -
      Math.max(position.top - lift, obstacle.top);

    return area + Math.max(0, width) * Math.max(0, height);
  }, 0);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, Math.max(min, max)));
}
