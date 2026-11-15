import type Phaser from 'phaser';
import { TRASH_BIN_PROFILE } from '../assets/trash-bin-profile';
import { TopplingContainer, type TopplingContainerConfig } from './TopplingContainer';
export type TrashBinConfig = TopplingContainerConfig;
export class TrashBin extends TopplingContainer {
  constructor(scene: Phaser.Scene, config: TrashBinConfig) {
    super(scene, config, TRASH_BIN_PROFILE);
  }
}
