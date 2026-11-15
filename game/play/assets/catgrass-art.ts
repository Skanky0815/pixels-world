import type Phaser from 'phaser';
import intact from '../../../assets/objects/catgrass/catgrass-intact.png?url';
import bitten from '../../../assets/objects/catgrass/catgrass-bitten.png?url';
import soil from '../../../assets/objects/catgrass/catgrass-soil.png?url';

export function preloadCatgrassArt(scene: Phaser.Scene) {
  scene.load.image('catgrass-intact', intact);
  scene.load.image('catgrass-bitten', bitten);
  scene.load.image('catgrass-soil', soil);
}
