import type Phaser from 'phaser';
import hairball from '../../../assets/objects/carpet/hairball.png?url';
export function preloadCarpetArt(scene: Phaser.Scene) { scene.load.image('hairball', hairball); }
