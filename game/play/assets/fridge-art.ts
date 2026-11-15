import type Phaser from 'phaser';
import upright from '../../../assets/objects/fridge/upright.png?url';
import open from '../../../assets/objects/fridge/open.png?url';
import ajar from '../../../assets/objects/fridge/ajar.png?url';

export function preloadFridgeArt(scene: Phaser.Scene) {
  scene.load.image('fridge-upright', upright);
  scene.load.image('fridge-open', open);
  scene.load.image('fridge-ajar', ajar);
}

export function fridgeArtReady(scene: Phaser.Scene) {
  return ['fridge-upright', 'fridge-ajar', 'fridge-open'].every((key) => scene.textures.exists(key));
}
