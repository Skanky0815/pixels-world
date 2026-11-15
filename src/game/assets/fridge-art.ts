import type Phaser from 'phaser';
import upright from '../../../assets/objects/fridge/upright.png?url';
import open from '../../../assets/objects/fridge/open.png?url';

export function preloadFridgeArt(scene: Phaser.Scene) {
  scene.load.image('fridge-upright', upright);
  scene.load.image('fridge-open', open);
}

export function fridgeArtReady(scene: Phaser.Scene) {
  return ['fridge-upright', 'fridge-open'].every((key) => scene.textures.exists(key));
}
