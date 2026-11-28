interface Size {
  readonly width: number;
  readonly height: number;
}
interface Anchor {
  readonly x: number;
  readonly top: number;
  readonly bottom: number;
}

/** CSS-pixel placement stays inside the visible canvas, even while the text lifts. */
export function feedbackPosition(anchor: Anchor, message: Size, canvas: Size, lift: number) {
  const margin = 8 + lift;
  const above = anchor.top - message.height - 12;
  const top = above >= margin ? above : anchor.bottom + 12;

  return {
    left: clamp(anchor.x - message.width / 2, 8, canvas.width - message.width - 8),
    top: clamp(top, margin, canvas.height - message.height - 8),
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, Math.max(min, max)));
}
