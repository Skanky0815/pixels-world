import type Phaser from 'phaser';
import type { LaundryAppearance } from '../interactions/laundry';

/** State sprites share the physical bottom anchor, including spilled clothes. */
export class LaundryArt {
  readonly root: Phaser.GameObjects.Container;
  private readonly image: Phaser.GameObjects.Image;

  constructor(
    scene: Phaser.Scene,
    private readonly appearance: LaundryAppearance,
  ) {
    this.image = scene.add.image(0, 0, 'bedroom-laundry-folded').setOrigin(0.5, 1);
    this.root = scene.add.container(0, 0, [this.image]).setDepth(2);
  }

  render(stage: number, wobble: number, reduced: boolean) {
    const state =
      this.appearance === 'basket'
        ? `basket-${stage === 2 ? 'spilled' : 'upright'}`
        : `laundry-${['folded', 'rumpled', 'spilled'][stage]}`;

    this.image.setTexture(`bedroom-${state}`);
    this.root.setAngle(stage === 2 || reduced ? 0 : stage === 1 ? 12 : Math.sin(wobble * 12) * 3);
  }
}
