import type Phaser from 'phaser';
import { Breakable, type BreakableConfig } from './Breakable';
import { DISH_PROFILES, type DishAppearance } from '../assets/dish-appearance';
export interface DishConfig extends BreakableConfig {
  readonly appearance: DishAppearance;
}

export class Dish extends Breakable {
  constructor(scene: Phaser.Scene, config: DishConfig) {
    super(scene, config, DISH_PROFILES[config.appearance]);
  }
}
