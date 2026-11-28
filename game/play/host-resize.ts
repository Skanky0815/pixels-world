import Phaser from 'phaser';
import { followsPixel } from './camera-mode';
import { OverlayLayout } from './ui/OverlayLayout';

/** CSS grid can settle after the window resize event; track the actual game host. */
// eslint-disable-next-line max-lines-per-function -- Host und Overlaybeobachter teilen die Lebensdauer des Spiels.
export function observeGameHost(game: Phaser.Game) {
  let pending = 0;
  const schedule = () => {
    cancelAnimationFrame(pending);
    pending = requestAnimationFrame(() => resizeCurrentHost(game));
  };

  const resized = () => {
    if (followsPixel()) schedule();
  };

  const observer = new ResizeObserver(schedule);

  game.scale.on(Phaser.Scale.Events.RESIZE, resized);

  const host = game.canvas.parentElement;

  if (host) {
    observer.observe(host);
    const overlays = new OverlayLayout(host);

    game.events.once(Phaser.Core.Events.DESTROY, () => overlays.destroy());
  }

  game.events.once(Phaser.Core.Events.DESTROY, () => {
    cancelAnimationFrame(pending);
    game.scale.off(Phaser.Scale.Events.RESIZE, resized);
    observer.disconnect();
  });
}

/** A menu/rotation can invalidate a queued observer entry before Phaser refreshes. */
function resizeCurrentHost(game: Phaser.Game) {
  const host = game.canvas.parentElement;

  if (!host) return;
  const box = host.getBoundingClientRect();
  const style = getComputedStyle(host);
  const width = box.width - parseFloat(style.borderLeftWidth) - parseFloat(style.borderRightWidth);
  const height =
    box.height - parseFloat(style.borderTopWidth) - parseFloat(style.borderBottomWidth);

  resizeHost(game, width, height);
}

// eslint-disable-next-line max-lines-per-function, complexity -- Aktuelle Raummaße, Kameraart und Hostgröße bestimmen dieselbe Canvas-Skalierung.
function resizeHost(game: Phaser.Game, width: number, height: number) {
  if (width <= 0 || height <= 0) return;
  const host = game.canvas.parentElement;
  const roomHeight = Number(host?.dataset.roomHeight ?? game.config.height);
  const logicalWidth = followsPixel()
    ? (roomHeight * width) / height
    : Number(host?.dataset.roomWidth ?? game.config.width);

  if (
    game.scale.parentSize.width === width &&
    game.scale.parentSize.height === height &&
    game.scale.width === logicalWidth &&
    game.scale.height === roomHeight
  )
    return;

  game.scale.setParentSize(width, height);

  if (game.scale.width !== logicalWidth || game.scale.height !== roomHeight)
    game.scale.setGameSize(logicalWidth, roomHeight);
}

/** A public room switch can change logical dimensions without recreating the game or observers. */
export function configureRoomHost(game: Phaser.Game, width: number, height: number) {
  const host = game.canvas.parentElement;

  if (!host) return;
  host.dataset.roomWidth = String(width);
  host.dataset.roomHeight = String(height);
  host.style.aspectRatio = `${width} / ${height}`;
  host.style.setProperty('--room-ratio', String(width / height));
  host.closest('main')?.style.setProperty('--room-ratio', String(width / height));
  resizeCurrentHost(game);
}
