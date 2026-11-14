import type Phaser from 'phaser';
import intact from '../../../assets/objects/food-bag/food-bag-intact.png?url';
import spilled from '../../../assets/objects/food-bag/food-bag-spilled.png?url';
export function preloadFoodBagArt(scene: Phaser.Scene) {
  scene.load.image('food-bag-intact', intact);
  scene.load.image('food-bag-spilled', spilled);
}
