import Phaser from 'phaser';
import './dev-shell.css';
import { BallPlayPreview } from './BallPlayPreview';

if (!import.meta.env.DEV) throw new Error('Ballspiel-Mockup ist nur im Dev-Betrieb verfügbar.');
const scene = new BallPlayPreview();
const game = new Phaser.Game({
  type: Phaser.CANVAS,
  parent: 'game',
  width: 960,
  height: 540,
  pixelArt: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 } } },
  scene,
});

import.meta.hot?.dispose(() => game.destroy(true));
