import './i18n/settings';
import { translateExact, onLanguageChange } from './i18n/locale';
import Phaser from 'phaser';
import './style.css';
import './mobile-landscape.css';
import './follow-camera-preview.css';
import './desktop-camera-preview.css';
import './ui/game-shell/shell.css';
import { observeGameHost } from './game/host-resize';
import { OBJECTS } from './content/objects/catalog';
import { selectRoom } from './content/rooms';
import { resolveRoom } from './game/content/resolve-room';
import './footer';
import { LivingRoomScene } from './game/scenes/LivingRoomScene';

document.documentElement.classList.toggle(
  'follow-camera',
  new URLSearchParams(location.search).get('camera') !== 'room',
);

const room = resolveRoom(
  selectRoom(
    new URLSearchParams(location.search).get('room'),
    import.meta.env.DEV || import.meta.env.MODE === 'e2e',
  ),
  OBJECTS,
);
const caption = document.querySelector('h1 span');

if (caption) {
  const refresh = () => {
    caption.textContent = translateExact(room.definition.caption);
  };

  refresh();
  onLanguageChange(refresh);
}

const gameHost = document.querySelector<HTMLElement>('#game');

if (gameHost) {
  gameHost.style.aspectRatio = `${room.definition.width} / ${room.definition.height}`;
  gameHost.style.setProperty(
    '--room-ratio',
    String(room.definition.width / room.definition.height),
  );
  gameHost
    .closest('main')
    ?.style.setProperty('--room-ratio', String(room.definition.width / room.definition.height));
}

new Phaser.Game({
  // A desktop window can enable DOM dialogue by resizing during the round.
  type: Phaser.CANVAS,
  parent: 'game',
  callbacks: { postBoot: observeGameHost },
  width: room.definition.width,
  height: room.definition.height,
  pixelArt: true,
  backgroundColor: room.definition.wallColor,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 1000 }, debug: false } },
  scene: new LivingRoomScene(room),
});

if (import.meta.env.PROD && import.meta.env.MODE !== 'e2e')
  void import('./pwa/register').then(({ registerOfflineGame }) => registerOfflineGame());
