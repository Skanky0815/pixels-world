import type Phaser from 'phaser';
import pixel from '../../../assets/objects/pictures/picture-pixel.png?url';
import berlin from '../../../assets/objects/pictures/picture-berlin.png?url';
import cozy from '../../../assets/objects/pictures/picture-cozy.png?url';
export function preloadPictureArt(scene: Phaser.Scene) {
  for (const [key, url] of Object.entries({ pixel, berlin, cozy })) scene.load.image(`picture-${key}`, url);
}
