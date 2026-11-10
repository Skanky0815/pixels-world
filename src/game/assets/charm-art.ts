import type Phaser from 'phaser';
import sheet from '../../../assets/pixel/charm-v1/charm-sheet-v1.png?url';

export function preloadCharmArt(scene: Phaser.Scene) {
  scene.load.spritesheet('pixel-charm', sheet, { frameWidth: 48, frameHeight: 48 });
}
