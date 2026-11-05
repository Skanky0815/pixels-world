/** Shared presentation positions for Sara and Pixel, independent of texture filenames. */
export function homecomingPositions(width: number) {
  const saraStartX = width + 32;
  const saraEndX = saraStartX - 146;

  return { saraStartX, saraEndX, pixelSeatX: saraEndX - 64 };
}
