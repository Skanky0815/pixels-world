import type Phaser from 'phaser';
import ball from '../../../assets/objects/favorite-ball/favorite-ball.png?url';

export const FAVORITE_BALL_TEXTURE = 'favorite-ball';

export function preloadFavoriteBallArt(scene: Phaser.Scene) {
  scene.load.image(FAVORITE_BALL_TEXTURE, ball);
}
