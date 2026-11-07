import type Phaser from 'phaser';
import cozy from '../../../assets/objects/couch/couch-cozy.png?url';
import worn from '../../../assets/objects/couch/couch-worn.png?url';
import scratch from '../../../assets/objects/couch/couch-scratch.png?url';

export function preloadCouchArt(scene: Phaser.Scene) {
  for (const [key, url] of Object.entries({
    'couch-cozy': cozy,
    'couch-worn': worn,
    'couch-scratch': scratch,
  }))
    scene.load.image(key, url);
}
