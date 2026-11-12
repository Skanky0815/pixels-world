import Phaser from 'phaser';
import { followsPixel, desktopFollowsPixel } from './camera-mode';

export function installFollowCamera(scene: Phaser.Scene, target: Phaser.Physics.Arcade.Sprite) {
  const refresh = () => refreshCamera(scene, target);

  refresh();
  scene.scale.on(Phaser.Scale.Events.RESIZE, refresh);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () =>
    scene.scale.off(Phaser.Scale.Events.RESIZE, refresh),
  );
}

export function backdropPadding(width: number) {
  return document.documentElement.classList.contains('follow-camera') ? width / 2 : 0;
}

// eslint-disable-next-line max-lines-per-function -- Beide Randflächen folgen den realen Touch-Flächen und demselben Pixelmaßstab.
function controlMargins(scene: Phaser.Scene) {
  const canvas = scene.game.canvas.getBoundingClientRect();
  const scale = (canvas.width / scene.scale.width) * scene.cameras.main.zoom;
  const left =
    document.querySelector('.touch-directions')?.getBoundingClientRect().right ?? canvas.left;
  const right =
    document.querySelector('.touch-actions')?.getBoundingClientRect().left ?? canvas.right;

  return {
    left: (left - canvas.left + 4) / scale + 6,
    right: (canvas.right - right + 4) / scale + 6,
  };
}

// eslint-disable-next-line max-lines-per-function -- Zoom, Bildränder und Folgepunkt werden gemeinsam anhand des aktuellen Layouts gesetzt.
function refreshCamera(scene: Phaser.Scene, target: Phaser.Physics.Arcade.Sprite) {
  const camera = scene.cameras.main;

  const room = scene.physics.world.bounds;
  const zoom = desktopFollowsPixel()
    ? 1.35
    : Math.max(2, Math.ceil(scene.scale.width / room.width));

  camera.setSize(scene.scale.width, scene.scale.height).setZoom(followsPixel() ? zoom : 1);
  scene.game.canvas.parentElement?.style.setProperty(
    '--camera-pixel-half',
    `${(32 * camera.zoom * scene.game.canvas.clientWidth) / scene.scale.width}px`,
  );

  const padding = cameraMargins(scene);

  camera.setBounds(
    room.x - padding.left,
    room.y,
    room.width + padding.left + padding.right,
    room.height,
  );

  if (followsPixel()) camera.startFollow(target, true, 1, 1);
  else camera.stopFollow().setScroll(0, 0);
}

function cameraMargins(scene: Phaser.Scene) {
  if (desktopFollowsPixel()) return { left: 24, right: 24 };

  return followsPixel() ? controlMargins(scene) : { left: 0, right: 0 };
}
