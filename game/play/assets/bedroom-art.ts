import type Phaser from 'phaser';
import curtain from '../../../assets/objects/bedroom/bedroom-curtain.png?url';
import curtainTear from '../../../assets/objects/bedroom/bedroom-curtain-tear.png?url';
import catbed from '../../../assets/objects/bedroom/bedroom-catbed.png?url';
import spiderplant from '../../../assets/objects/bedroom/bedroom-spiderplant-intact.png?url';
import spiderplantBitten from '../../../assets/objects/bedroom/bedroom-spiderplant-bitten.png?url';
import lamp from '../../../assets/objects/bedroom/bedroom-lamp.png?url';
import runner from '../../../assets/objects/bedroom/bedroom-runner.png?url';

import bed from '../../../assets/environment/bedroom/bedroom-bed.png?url';
import nightstand from '../../../assets/environment/bedroom/bedroom-nightstand.png?url';
import wardrobe from '../../../assets/environment/bedroom/bedroom-wardrobe.png?url';
import door from '../../../assets/environment/bedroom/bedroom-door.png?url';
import window from '../../../assets/environment/bedroom/bedroom-window.png?url';
import plaster from '../../../assets/environment/bedroom/bedroom-plaster.png?url';
import floor from '../../../assets/environment/bedroom/bedroom-floor.png?url';
import laundry_folded from '../../../assets/objects/bedroom/bedroom-laundry-folded.png?url';
import laundry_rumpled from '../../../assets/objects/bedroom/bedroom-laundry-rumpled.png?url';
import laundry_spilled from '../../../assets/objects/bedroom/bedroom-laundry-spilled.png?url';
import basket_upright from '../../../assets/objects/bedroom/bedroom-basket-upright.png?url';
import basket_spilled from '../../../assets/objects/bedroom/bedroom-basket-spilled.png?url';

export const LAMP_PROFILE = {
  width: 28, height: 38, mass: 1, breakSpeed: 180, breakPower: 260,
  texture: 'bedroom-lamp', shardTexture: 'vase-shard-gold',
} as const;

// eslint-disable-next-line max-lines-per-function -- Die zusammengehörigen Raum- und Zustandstexturen werden gemeinsam vorgeladen.
export function preloadBedroomArt(scene: Phaser.Scene) {
  scene.load.image('sleep-pad', catbed);
  scene.load.image('bedroom-curtain', curtain);
  scene.load.image('bedroom-curtain-tear', curtainTear);
  scene.load.image('bedroom-bed', bed);
  scene.load.image('bedroom-nightstand', nightstand);
  scene.load.image('bedroom-wardrobe', wardrobe);
  scene.load.image('bedroom-door', door);
  scene.load.image('bedroom-window', window);
  scene.load.image('bedroom-plaster', plaster);
  scene.load.image('bedroom-floor', floor);
  scene.load.image('bedroom-laundry-folded', laundry_folded);
  scene.load.image('bedroom-laundry-rumpled', laundry_rumpled);
  scene.load.image('bedroom-laundry-spilled', laundry_spilled);
  scene.load.image('bedroom-basket-upright', basket_upright);
  scene.load.image('bedroom-basket-spilled', basket_spilled);
  scene.load.image('bedroom-spiderplant-intact', spiderplant);
  scene.load.image('bedroom-spiderplant-bitten', spiderplantBitten);
  scene.load.image('bedroom-lamp', lamp);
  scene.load.image('bedroom-runner', runner);
}
