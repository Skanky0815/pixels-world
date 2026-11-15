import Phaser from 'phaser';
import './dev-shell.css';
import './charm-preview.css';
import { CharmPreview } from './CharmPreview';

if (!import.meta.env.DEV) throw new Error('Charme-Vorschau ist nur im Dev-Betrieb verfügbar.');
const game = new Phaser.Game({
  type: Phaser.CANVAS,
  parent: 'charm-stage',
  width: 960,
  height: 540,
  pixelArt: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 } } },
  scene: CharmPreview,
});

import.meta.hot?.dispose(() => game.destroy(true));
