/** Shared only by exporters with the same alpha bounds and centered 2×2 sampling. */
export function alphaBounds(image, minimumAlpha, emptyMessage) {
  let left = image.width,
    top = image.height,
    right = -1,
    bottom = -1;

  for (let y = 0; y < image.height; y++)
    for (let x = 0; x < image.width; x++)
      if (image.data[(y * image.width + x) * 4 + 3] >= minimumAlpha) {
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }

  if (right < left) throw new Error(emptyMessage);

  return { left, top, width: right - left + 1, height: bottom - top + 1 };
}

/** Copies RGB unchanged, with binary alpha, to one logical 2×2 output pixel. */
export function copyPixel2x2(image, output, box, x, y, minimumAlpha) {
  const sx =
    box.left + Math.min(box.width - 1, Math.floor(((x + 0.5) * box.width) / (output.width / 2)));
  const sy =
    box.top + Math.min(box.height - 1, Math.floor(((y + 0.5) * box.height) / (output.height / 2)));
  const source = (sy * image.width + sx) * 4;

  if (image.data[source + 3] < minimumAlpha) return;

  for (let dy = 0; dy < 2; dy++)
    for (let dx = 0; dx < 2; dx++) {
      const target = ((y * 2 + dy) * output.width + x * 2 + dx) * 4;

      output.data.set([...image.data.subarray(source, source + 3), 255], target);
    }
}
