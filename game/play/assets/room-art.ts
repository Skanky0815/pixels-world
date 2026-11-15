import type Phaser from 'phaser';
import plaster from '../../../assets/environment/living-room/room-plaster.png?url';
import panel from '../../../assets/environment/living-room/room-panel.png?url';
import floor from '../../../assets/environment/living-room/room-floor.png?url';
import ceiling from '../../../assets/environment/living-room/room-ceiling.png?url';
import window from '../../../assets/environment/living-room/room-window.png?url';
import picture from '../../../assets/environment/living-room/room-picture.png?url';
import door from '../../../assets/environment/living-room/room-door.png?url';
import rug from '../../../assets/environment/living-room/room-rug.png?url';

const ROOM_ART = { plaster, panel, floor, ceiling, window, picture, door, rug };

export function preloadRoomArt(scene: Phaser.Scene) {
  for (const [key, url] of Object.entries(ROOM_ART)) scene.load.image(`room-${key}`, url);
}
