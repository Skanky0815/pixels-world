import type Phaser from 'phaser';
import type { BookToppling } from '../interactions/book-toppling';
export type BookAppearance = 'stacked' | 'upright';
const colors = [0x597780, 0xa65f51, 0xb59d62, 0x6c775c];

/** Original code-drawn covers and paper; the fallen books retain their thickness. */
// eslint-disable-next-line max-lines-per-function -- Die vier Bücher teilen Palette und zeitabhängige Stapel-/Fallgeometrie.
export function drawBooks(
  graphics: Phaser.GameObjects.Graphics,
  state: ReturnType<BookToppling['snapshot']>,
  appearance: BookAppearance = 'stacked',
) {
  graphics.clear();
  const progress =
    state.state === 'falling' || state.state === 'fallen' ? Math.min(1, state.progress) : 0;
  const wobble = state.state === 'wobbling' ? Math.sin(state.progress * 36) * 2 : 0;

  if (appearance === 'upright') return drawUprightBooks(graphics, progress, wobble);

  for (const [index, color] of colors.entries()) {
    const x = -19 + (index % 2) * 3 + (index - 1.5) * 12 * progress + (wobble * index) / 3;
    const y = -8 * (index + 1) * (1 - progress) - (11 + (index % 2) * 5) * progress;

    graphics
      .save()
      .translateCanvas(x + 19, y + 3.5)
      .rotateCanvas((index % 2 ? 0.12 : -0.12) * progress);
    graphics.fillStyle(0x382d2a).fillRect(-20, -4.5, 40, 9);
    graphics.fillStyle(color).fillRect(-19, -3.5, 38, 7);
    graphics.fillStyle(0xd9c8a2).fillRect(-14, -1.5, 30, 3);
    graphics.fillStyle(0x4b3830).fillRect(-16, -3.5, 2, 7);
    graphics.restore();
  }
}

// eslint-disable-next-line max-lines-per-function -- Buchrücken mit Titelfeldern kippen aus derselben Ausgangsgröße in eine flache Streulage.
function drawUprightBooks(graphics: Phaser.GameObjects.Graphics, progress: number, wobble: number) {
  for (const [index, color] of colors.entries()) {
    const x = (index - 1.5) * (9 + 3 * progress) + (wobble * index) / 3;
    const y = -18 * (1 - progress) - (8 + (index % 2) * 5) * progress;

    graphics
      .save()
      .translateCanvas(x, y)
      .rotateCanvas((Math.PI / 2) * progress + wobble * 0.02);
    graphics.fillStyle(0x382d2a).fillRect(-5, -17, 10, 34);
    graphics.fillStyle(color).fillRect(-4, -16, 8, 32);
    graphics.fillStyle(0xd9c8a2).fillRect(-3, -15, 6, 2);
    graphics.fillStyle(0xd6b375).fillRect(-3, -8, 6, 1).fillRect(-3, 10, 6, 1);
    graphics.fillStyle(0xefe2bf).fillRect(-2, -3, 4, 6);
    graphics.restore();
  }
}
