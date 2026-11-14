import type Phaser from 'phaser';
import type { Toppling } from '../interactions/toppling';
import { motionPreferences } from '../../settings/motion';

export class FoodBagArt {
  readonly root: Phaser.GameObjects.Container;
  private readonly intact: Phaser.GameObjects.Image;
  private readonly spilled: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene) {
    this.intact = scene.add.image(0, 0, 'food-bag-intact').setOrigin(0.5, 1);
    this.spilled = scene.add.image(0, 0, 'food-bag-spilled').setOrigin(0.5, 1).setVisible(false);
    this.root = scene.add.container(0, 0, [this.intact, this.spilled]);
  }

  // eslint-disable-next-line max-lines-per-function -- Ein gemeinsamer Fußanker hält Wackeln, echte Kipprichtung und den begrenzten Futterstreuzustand zusammen.
  render(state: ReturnType<Toppling<'upright'>['snapshot']>, direction: number) {
    const progress =
      state.state === 'fallen' ? 1 : state.state === 'falling' ? Math.min(1, state.progress) : 0;
    const reduced = motionPreferences.snapshot().reduced;
    const wobble =
      state.state === 'wobbling' && !reduced ? Math.sin(state.progress * 36) * 0.04 : 0;

    this.intact
      .setVisible(progress < 1)
      .setAlpha(1 - progress)
      .setRotation(reduced ? 0 : direction * ((progress * Math.PI) / 2 + wobble));
    this.intact.setPosition(0, reduced ? 0 : -Math.sin((progress * Math.PI) / 2) * 16);
    this.spilled
      .setVisible(progress > 0)
      .setAlpha(progress)
      .setFlipX(direction < 0);
  }

  snapshot() {
    return {
      intactTexture: this.intact.texture.key,
      spilledTexture: this.spilled.texture.key,
      intactVisible: this.intact.visible,
      spilledVisible: this.spilled.visible,
    };
  }
}
