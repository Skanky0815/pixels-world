import type Phaser from 'phaser';
import terracotta from '../../../assets/objects/vases/vase-terracotta-intact.png?url';
import blue from '../../../assets/objects/vases/vase-blue-intact.png?url';
import gold from '../../../assets/objects/vases/vase-gold-intact.png?url';
import mellow from '../../../assets/objects/vases/vase-mellow-intact.png?url';
import terracottaShard from '../../../assets/objects/vases/vase-terracotta-shard.png?url';
import blueShard from '../../../assets/objects/vases/vase-blue-shard.png?url';
import goldShard from '../../../assets/objects/vases/vase-gold-shard.png?url';

export const VASE_ART_URLS = {
  'vase-terracotta': terracotta,
  'vase-blue': blue,
  'vase-gold': gold,
  'vase-mellow': mellow,
  'vase-shard-terracotta': terracottaShard,
  'vase-shard-blue': blueShard,
  'vase-shard-gold': goldShard,
};

export function preloadVaseArt(scene: Phaser.Scene) {
  for (const [key, url] of Object.entries(VASE_ART_URLS)) scene.load.image(key, url);
}
