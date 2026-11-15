import type Phaser from 'phaser';
import curtain from '../../../assets/objects/curtain/curtain-rust.png?url';
import tear from '../../../assets/objects/curtain/curtain-tear.png?url';

export function preloadCurtainArt(scene: Phaser.Scene) {
  scene.load.image('curtain-rust', curtain);
  scene.load.image('curtain-tear', tear);
}
