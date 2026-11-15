import type { CharmPose } from '../domain/charm-motion.ts';

export type HomecomingSide = 'left' | 'right';

/** Dialogue and charm share the free side opposite Sara's entrance. */
export function homecomingPanel(width: number, side: HomecomingSide = 'right') {
  const panelWidth = Math.min(width - 80, 610);
  const left = side === 'left' ? width - 40 - panelWidth : 40;

  return { left, width: panelWidth, right: left + panelWidth };
}

/** Shared presentation positions for Sara and Pixel, independent of texture filenames. */
export function homecomingPositions(width: number, side: HomecomingSide = 'right') {
  const saraStartX = width + 32;
  const saraEndX = saraStartX - 146;
  const positions = { saraStartX, saraEndX, pixelSeatX: saraEndX - 64 };

  return side === 'left'
    ? { saraStartX: -32, saraEndX: width - saraEndX, pixelSeatX: width - positions.pixelSeatX }
    : positions;
}

/** Mirror presentation only; the choreography and game state retain their normal coordinates. */
export function homecomingCharmPose(pose: CharmPose, side: HomecomingSide = 'right'): CharmPose {
  return side === 'left'
    ? { ...pose, x: -pose.x, angle: -pose.angle, faceLeft: !pose.faceLeft }
    : pose;
}
