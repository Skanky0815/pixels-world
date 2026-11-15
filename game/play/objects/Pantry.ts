import type Phaser from 'phaser';
import { PANTRY_PROFILES, type PantryAppearance } from '../assets/pantry-appearance';
import { Breakable, type BreakableConfig } from './Breakable';
export interface PantryConfig extends BreakableConfig {
  readonly appearance: PantryAppearance;
}
export class Pantry extends Breakable {
  constructor(scene: Phaser.Scene, config: PantryConfig) {
    super(scene, config, PANTRY_PROFILES[config.appearance]);
  }

  snapshot() {
    return { ...super.snapshot(), ...this.damageSnapshot(), contents: this.contentsSnapshot() };
  }
}
