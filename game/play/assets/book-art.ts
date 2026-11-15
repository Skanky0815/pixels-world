import type Phaser from 'phaser';
import stacked from '../../../assets/objects/books/books-stacked.png?url';
import upright from '../../../assets/objects/books/books-upright.png?url';
import fallen from '../../../assets/objects/books/books-fallen.png?url';

export const BOOK_ART_URLS = { 'books-stacked': stacked, 'books-upright': upright, 'books-fallen': fallen };

export function preloadBookArt(scene: Phaser.Scene) {
  for (const [key, url] of Object.entries(BOOK_ART_URLS)) scene.load.image(key, url);
}
