import Phaser from 'phaser';
import './style.css';
import { OBJECTS } from './content/objects/catalog';
import { selectRoom } from './content/rooms';
import { resolveRoom } from './game/content/resolve-room';
import './footer';
import { LivingRoomScene } from './game/scenes/LivingRoomScene';

const room = resolveRoom(selectRoom(new URLSearchParams(location.search).get('room'), import.meta.env.DEV || import.meta.env.MODE === 'e2e'), OBJECTS);
const caption = document.querySelector('h1 span');
if (caption) caption.textContent = room.definition.caption;
const gameHost = document.querySelector<HTMLElement>('#game');
if (gameHost) gameHost.style.aspectRatio = `${room.definition.width} / ${room.definition.height}`;

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: room.definition.width,
  height: room.definition.height,
  pixelArt: true,
  backgroundColor: room.definition.wallColor,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 1000 }, debug: false } },
  scene: new LivingRoomScene(room),
});
