import type Phaser from 'phaser';
import { VASE_SHARD_FAMILY, type VaseAppearance } from '../assets/vase-appearance';
import { Breakable, type BreakableConfig } from './Breakable';
export type { BreakableState as VaseState } from './Breakable';
export interface VaseConfig extends BreakableConfig {
  readonly appearance?: VaseAppearance;
}

/** Preserve every vase rule while sharing the actual body, fall, collision and damage lifecycle. */
export class Vase extends Breakable {
  // eslint-disable-next-line max-lines-per-function -- Das unveränderte Vasenprofil bleibt beim gemeinsamen Körperaufbau vollständig sichtbar.
  constructor(scene: Phaser.Scene, config: VaseConfig) {
    super(scene, config, {
      width: 18,
      height: 28,
      mass: 1,
      breakSpeed: 180,
      breakPower: 260,
      texture: config.appearance ? `vase-${config.appearance}` : undefined,
      shardTexture: config.appearance
        ? `vase-shard-${VASE_SHARD_FAMILY[config.appearance]}`
        : undefined,
    });
  }
}
