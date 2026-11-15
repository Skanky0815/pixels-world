import type Phaser from 'phaser';
import bowl from '../../../assets/objects/food-bowl/food-bowl.png?url';
export const FOOD_BOWL_TEXTURE = 'food-bowl';
export function preloadFoodBowlArt(scene: Phaser.Scene) {
  scene.load.image(FOOD_BOWL_TEXTURE, bowl);
}
