import Phaser from 'phaser';
import './style.css';
import { ROOM } from './game/config/room';
import { LivingRoomScene } from './game/scenes/LivingRoomScene';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: ROOM.width,
  height: ROOM.height,
  pixelArt: true,
  backgroundColor: '#cbb192',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 1000 }, debug: false } },
  scene: LivingRoomScene,
});
