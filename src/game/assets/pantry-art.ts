import type Phaser from 'phaser';
import jar from '../../../assets/objects/pantry/jar.png?url';
import tin from '../../../assets/objects/pantry/tin.png?url';
import jarBroken from '../../../assets/objects/pantry/jar-broken.png?url';
import tinOpened from '../../../assets/objects/pantry/tin-opened.png?url';
import shard from '../../../assets/objects/pantry/glass-shard.png?url';
const ART = { jar, tin, 'jar-broken': jarBroken, 'tin-opened': tinOpened, 'glass-shard': shard };

export function preloadPantryArt(scene: Phaser.Scene) {
  for (const [key, url] of Object.entries(ART)) scene.load.image(`pantry-${key}`, url);
}

export function pantryArtReady(scene: Phaser.Scene) {
  return Object.keys(ART).every((key) => scene.textures.exists(`pantry-${key}`));
}
