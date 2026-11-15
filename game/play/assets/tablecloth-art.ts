import type Phaser from 'phaser';
import pattern from '../../../assets/objects/tablecloth/pattern.png?url';
import pile from '../../../assets/objects/tablecloth/pile.png?url';
export function preloadTableclothArt(scene: Phaser.Scene) {
  scene.load.image('tablecloth-pattern', pattern);
  scene.load.image('tablecloth-pile', pile);
}

export function tableclothArtReady(scene: Phaser.Scene) {
  return ['tablecloth-pattern', 'tablecloth-pile'].every((key) => scene.textures.exists(key));
}
