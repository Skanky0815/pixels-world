import type Phaser from 'phaser';
import sheet from '../../../assets/sara/ending-v1/ending-sheet-v1.png?url';
import { SARA_ENDING_SPRITE } from '../actors/sara-endings';

export function preloadSaraEndingArt(scene: Phaser.Scene) {
  scene.load.spritesheet('sara-ending', sheet, SARA_ENDING_SPRITE);
}
