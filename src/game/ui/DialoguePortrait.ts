import type Phaser from 'phaser';
import type { DialoguePortrait as PortraitId } from '../domain/dialogue-portrait';

/** Decorative image: missing textures retain the complete text-only dialogue. */
export class DialoguePortrait {
  readonly image: Phaser.GameObjects.Image;

  constructor(
    private readonly scene: Phaser.Scene,
    x: number,
    y: number,
  ) {
    this.image = scene.add.image(x, y, '__MISSING').setDisplaySize(80, 80).setVisible(false);
  }

  render(id: PortraitId | null) {
    const available = id !== null && this.scene.textures.exists(id);

    this.image.setVisible(available);

    if (available)
      this.image.setTexture(id).setDisplaySize(80, 80).setFlipX(id.startsWith('sara-'));

    return available;
  }

  snapshot() {
    return Object.freeze({
      visible: this.image.visible,
      texture: this.image.texture.key,
      flipped: this.image.flipX,
    });
  }
}

/** Rewrap only when the portrait/fallback changes, not on every frame. */
export function placeDialogueText(text: Phaser.GameObjects.Text, x: number, width: number) {
  text.setX(x);

  if (text.style.wordWrapWidth !== width) text.setWordWrapWidth(width);
}
