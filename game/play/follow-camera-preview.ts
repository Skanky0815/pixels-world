import Phaser from 'phaser';
import { followsPixel } from './camera-mode';
import { SARA_SPRITE } from './actors/sara-animations';

// eslint-disable-next-line max-lines-per-function -- Größen- und Overlaywechsel teilen denselben Kamera-Refresh und Shutdown.
export function installFollowCamera(
  scene: Phaser.Scene,
  target: Phaser.Physics.Arcade.Sprite,
  floorY: number,
) {
  const refresh = () => refreshCamera(scene, target, floorY);

  refresh();
  scene.scale.on(Phaser.Scale.Events.RESIZE, refresh);
  const host = scene.game.canvas.parentElement;

  host?.addEventListener('overlaylayoutchange', refresh);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    scene.scale.off(Phaser.Scale.Events.RESIZE, refresh);
    host?.removeEventListener('overlaylayoutchange', refresh);
  });
}

export function backdropPadding(width: number) {
  return document.documentElement.classList.contains('follow-camera') ? width / 2 : 0;
}

// eslint-disable-next-line max-lines-per-function -- Beide Randflächen folgen den realen Touch-Flächen und demselben Pixelmaßstab.
function controlMargins(scene: Phaser.Scene) {
  const canvas = scene.game.canvas.getBoundingClientRect();
  const scale = (canvas.width / scene.scale.width) * scene.cameras.main.zoom;
  const directions = document.querySelector<HTMLElement>('.touch-directions');
  const actions = document.querySelector<HTMLElement>('.touch-actions');
  const left = directions?.offsetWidth ? directions.getBoundingClientRect().right : canvas.left;
  const right = actions?.offsetWidth ? actions.getBoundingClientRect().left : canvas.right;

  return {
    left: (left - canvas.left + 4) / scale + 6,
    right: (canvas.right - right + 4) / scale + 6,
  };
}

// eslint-disable-next-line max-lines-per-function -- Zoom, Bildränder und Folgepunkt werden gemeinsam anhand des aktuellen Layouts gesetzt.
function refreshCamera(scene: Phaser.Scene, target: Phaser.Physics.Arcade.Sprite, floorY: number) {
  const camera = scene.cameras.main;

  const room = scene.physics.world.bounds;
  const portrait = scene.scale.height > scene.scale.width;
  const short = matchMedia('(orientation: landscape) and (max-height: 550px)').matches;
  const zoom = portrait ? 1 : short ? Math.max(2, Math.ceil(scene.scale.width / room.width)) : 1.35;

  camera.setSize(scene.scale.width, scene.scale.height).setZoom(followsPixel() ? zoom : 1);
  scene.game.canvas.parentElement?.style.setProperty(
    '--camera-pixel-half',
    `${(32 * camera.zoom * scene.game.canvas.clientWidth) / scene.scale.width}px`,
  );
  scene.game.canvas.parentElement?.style.setProperty(
    '--camera-actor-height',
    `${(SARA_SPRITE.frameHeight * SARA_SPRITE.scale * camera.zoom * scene.game.canvas.clientWidth) / scene.scale.width}px`,
  );

  const padding = cameraMargins(scene);

  camera.setBounds(
    room.x - padding.left,
    room.y,
    room.width + padding.left + padding.right,
    room.height + portraitBottom(scene, floorY),
  );

  camera.setDeadzone();

  if (followsPixel()) {
    camera.startFollow(target, true, 1, 1);

    // Small standing corrections must not drag the entire phone view along.
    if (short) camera.setDeadzone(4, 4);
  } else camera.stopFollow().setScroll(0, 0);
}

function cameraMargins(scene: Phaser.Scene) {
  return followsPixel() ? controlMargins(scene) : { left: 0, right: 0 };
}

/** Keep the floor actors above portrait announcements without reducing the viewport. */
// eslint-disable-next-line max-lines-per-function -- Overlayreserve und vorhandener Bodenabstand werden einmal in Weltkoordinaten umgerechnet.
function portraitBottom(scene: Phaser.Scene, floorY: number) {
  if (!followsPixel() || scene.scale.width >= scene.scale.height) return 0;
  const canvas = scene.game.canvas;
  const main = canvas.closest('main');
  const reserve = main
    ? parseFloat(getComputedStyle(main).getPropertyValue('--overlay-scene-bottom'))
    : 0;

  return Math.max(
    0,
    ((reserve || 0) * scene.scale.height) / canvas.clientHeight -
      (scene.physics.world.bounds.height - floorY),
  );
}
