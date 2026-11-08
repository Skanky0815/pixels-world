import type Phaser from 'phaser';
import type { BookToppling } from '../interactions/book-toppling';
import { motionPreferences } from '../../settings/motion';
export type BookAppearance = 'stacked' | 'upright';

/** Generated PNGs own the artwork; code only positions and animates them. */
export class BookArt {
  readonly root: Phaser.GameObjects.Container;
  private readonly intact: Phaser.GameObjects.Image;
  private readonly fallen: Phaser.GameObjects.Image;
  private readonly tilt: number;

  constructor(scene: Phaser.Scene, appearance: BookAppearance = 'stacked') {
    this.tilt = appearance === 'upright' ? Math.PI / 2 : 0.35;
    this.intact = scene.add.image(0, 0, `books-${appearance}`).setOrigin(0.5, 1);
    this.fallen = scene.add.image(0, 0, 'books-fallen').setOrigin(0.5, 1).setVisible(false);
    this.root = scene.add.container(0, 0, [this.intact, this.fallen]);
  }

  // eslint-disable-next-line max-lines-per-function -- Wackeln, Umkippen und Übergang zum verstreuten PNG folgen demselben unveränderlichen Modellzustand.
  render(state: ReturnType<BookToppling['snapshot']>) {
    const progress =
      state.state === 'fallen' ? 1 : state.state === 'falling' ? Math.min(1, state.progress) : 0;
    const reduced = motionPreferences.snapshot().reduced;
    const wobble = state.state === 'wobbling' && !reduced ? Math.sin(state.progress * 36) * 1.5 : 0;
    const rotation = reduced ? 0 : progress * this.tilt + wobble * 0.02;

    this.intact.setVisible(progress < 1).setAlpha(1 - progress);
    this.intact.setPosition(
      wobble,
      reduced ? 0 : -Math.abs(Math.sin(rotation)) * 24 - Math.sin(progress * Math.PI) * 4,
    );
    this.intact.setRotation(rotation);
    this.fallen
      .setVisible(progress > 0)
      .setAlpha(progress)
      .setScale(reduced ? 1 : 0.75 + progress * 0.25);
  }

  snapshot() {
    return {
      intactTexture: this.intact.texture.key,
      fallenTexture: this.fallen.texture.key,
      intactVisible: this.intact.visible,
      fallenVisible: this.fallen.visible,
    };
  }
}
