import type Phaser from 'phaser';
import { LAMP_PROFILE } from '../assets/bedroom-art';
import { Breakable, type BreakableConfig } from './Breakable';

/** A lamp uses the same push, impact, shards, scoring and reset lifecycle as a vase. */
export class Lamp extends Breakable {
  constructor(scene: Phaser.Scene, config: BreakableConfig) {
    super(scene, config, LAMP_PROFILE);
  }
}
