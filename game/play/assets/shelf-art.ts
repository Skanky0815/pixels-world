import type Phaser from 'phaser';
import left from '../../../assets/objects/shelves/shelf-left.png?url';
import center from '../../../assets/objects/shelves/shelf-center.png?url';
import right from '../../../assets/objects/shelves/shelf-right.png?url';
import breakEdge from '../../../assets/objects/shelves/shelf-break.png?url';
import bracket from '../../../assets/objects/shelves/shelf-bracket.png?url';

export function preloadShelfArt(scene: Phaser.Scene) {
  for (const [key, url] of Object.entries({ left, center, right, bracket, break: breakEdge }))
    scene.load.image(`shelf-${key}`, url);
}
