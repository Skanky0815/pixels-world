import type Phaser from 'phaser';
import cup from '../../../assets/objects/dishes/cup.png?url';
import plate from '../../../assets/objects/dishes/plate.png?url';
import shard from '../../../assets/objects/dishes/shard.png?url';
export function preloadDishArt(scene: Phaser.Scene) {
  scene.load.image('dish-cup', cup);
  scene.load.image('dish-plate', plate);
  scene.load.image('dish-shard', shard);
}
