import type Phaser from 'phaser';
import intact from '../../../assets/objects/trash-bin/intact.png?url';
import spilled from '../../../assets/objects/trash-bin/spilled.png?url';
export function preloadTrashBinArt(scene: Phaser.Scene) {
  scene.load.image('trash-bin-intact', intact);
  scene.load.image('trash-bin-spilled', spilled);
}

export function trashBinArtReady(scene: Phaser.Scene) {
  return ['trash-bin-intact', 'trash-bin-spilled'].every((key) => scene.textures.exists(key));
}
