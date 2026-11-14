import type Phaser from 'phaser';
import { TopplingContainer, type TopplingContainerConfig } from './TopplingContainer';
export type FoodBagConfig = TopplingContainerConfig;
const FOOD_BAG_PROFILE = {
  width: 32,
  height: 44,
  spilledWidth: 96,
  spilledHeight: 28,
  mass: 1.4,
  impactPower: 90,
  intactTexture: 'food-bag-intact',
  spilledTexture: 'food-bag-spilled',
} as const;

export class FoodBag extends TopplingContainer {
  constructor(scene: Phaser.Scene, config: FoodBagConfig) {
    super(scene, config, FOOD_BAG_PROFILE);
  }
}
