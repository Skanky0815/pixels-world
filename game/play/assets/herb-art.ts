import type Phaser from 'phaser';
import basil from '../../../assets/objects/herbs/basil-intact.png?url';
import basilBitten from '../../../assets/objects/herbs/basil-bitten.png?url';
import parsley from '../../../assets/objects/herbs/parsley-intact.png?url';
import parsleyBitten from '../../../assets/objects/herbs/parsley-bitten.png?url';
import mint from '../../../assets/objects/herbs/mint-intact.png?url';
import mintBitten from '../../../assets/objects/herbs/mint-bitten.png?url';
const ART = {
  'basil-intact': basil,
  'basil-bitten': basilBitten,
  'parsley-intact': parsley,
  'parsley-bitten': parsleyBitten,
  'mint-intact': mint,
  'mint-bitten': mintBitten,
};

export function preloadHerbArt(scene: Phaser.Scene) {
  for (const [key, url] of Object.entries(ART)) scene.load.image(`herb-${key}`, url);
}

export function herbArtReady(scene: Phaser.Scene) {
  return Object.keys(ART).every((key) => scene.textures.exists(`herb-${key}`));
}
