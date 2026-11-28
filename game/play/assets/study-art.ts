import type Phaser from 'phaser';
import paper from '../../../assets/objects/study/study-paper-stacked.png?url';
import fallen from '../../../assets/objects/study/study-paper-fallen.png?url';
import cup from '../../../assets/objects/study/study-pen-cup.png?url';
import spilled from '../../../assets/objects/study/study-pen-cup-spilled.png?url';

import space from '../../../assets/objects/study/study-poster-space.png?url';
import arcade from '../../../assets/objects/study/study-poster-arcade.png?url';

import desk from '../../../assets/environment/study/study-desk.png?url';
import chair from '../../../assets/environment/study/study-chair.png?url';
import bookcase from '../../../assets/environment/study/study-bookcase.png?url';
import board from '../../../assets/environment/study/study-bookcase-board.png?url';
import monitor from '../../../assets/environment/study/study-monitor.png?url';

const ART = { 'study-desk': desk, 'study-chair': chair, 'study-bookcase': bookcase, 'study-bookcase-board': board, 'study-monitor': monitor, 'picture-poster-space': space, 'picture-poster-arcade': arcade, 'study-paper': paper, 'study-paper-fallen': fallen, 'study-pen-cup': cup, 'study-pen-cup-spilled': spilled };

export function preloadStudyArt(scene: Phaser.Scene) {
  for (const [key,url] of Object.entries(ART)) scene.load.image(key,url);
}
