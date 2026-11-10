import type { Bounds } from '../interactions/contracts.ts';

export interface VaseImpact {
  readonly sourceId: string;
  readonly state: 'resting' | 'moving' | 'falling' | 'broken';
  readonly bounds: Bounds;
  readonly velocityX: number;
  readonly velocityY: number;
}

/** Small deterministic, one-way chain: only a moving/falling vase can topple books. */
export function hitsBooks(impact: VaseImpact, target: Bounds) {
  const moving = impact.state === 'moving' && Math.hypot(impact.velocityX, impact.velocityY) >= 60;

  return (moving || impact.state === 'falling') && intersects(impact.bounds, target);
}

function intersects(a: Bounds, b: Bounds) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}
