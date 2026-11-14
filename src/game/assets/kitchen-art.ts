import type Phaser from 'phaser';
import plaster from '../../../assets/environment/kitchen/kitchen-plaster.png?url';
import stool from '../../../assets/environment/kitchen/kitchen-stool.png?url';
import table from '../../../assets/environment/kitchen/kitchen-table.png?url';
import counter from '../../../assets/environment/kitchen/kitchen-counter.png?url';
import wallCabinet from '../../../assets/environment/kitchen/kitchen-wall-cabinet.png?url';
import wallTiles from '../../../assets/environment/kitchen/kitchen-wall-tiles.png?url';
import floorTiles from '../../../assets/environment/kitchen/kitchen-floor-tiles.png?url';

const ART = {
  plaster,
  stool,
  table,
  counter,
  'wall-cabinet': wallCabinet,
  'wall-tiles': wallTiles,
  'floor-tiles': floorTiles,
};

export function preloadKitchenArt(scene: Phaser.Scene) {
  for (const [name, url] of Object.entries(ART)) scene.load.image(`kitchen-${name}`, url);
}

/** Room changes restart the scene without another preload phase. */
export function kitchenArtReady(scene: Phaser.Scene) {
  return Object.keys(ART).every((name) => scene.textures.exists(`kitchen-${name}`));
}
