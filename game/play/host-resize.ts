import Phaser from 'phaser';
import { followsPixel } from './camera-mode';
import { OverlayLayout } from './ui/OverlayLayout';

/** CSS grid can settle after the window resize event; track the actual game host. */
// eslint-disable-next-line max-lines-per-function -- Host und Overlaybeobachter teilen die Lebensdauer des Spiels.
export function observeGameHost(game: Phaser.Game) {
  const observer = new ResizeObserver(([entry]) => {
    resizeHost(game, entry.contentRect.width, entry.contentRect.height);
  });

  const host = game.canvas.parentElement;

  if (host) {
    observer.observe(host);
    const overlays = new OverlayLayout(host);

    game.events.once(Phaser.Core.Events.DESTROY, () => overlays.destroy());
  }

  game.events.once(Phaser.Core.Events.DESTROY, () => observer.disconnect());
}

// eslint-disable-next-line max-lines-per-function, complexity -- Aktuelle Raummaße, Kameraart und Hostgröße bestimmen dieselbe Canvas-Skalierung.
function resizeHost(game: Phaser.Game, width: number, height: number) {
  if (width <= 0 || height <= 0) return;
  const host = game.canvas.parentElement;
  const roomHeight = Number(host?.dataset.roomHeight ?? game.config.height);
  const logicalWidth = followsPixel()
    ? (roomHeight * width) / height
    : Number(host?.dataset.roomWidth ?? game.config.width);

  game.scale.setParentSize(width, height);

  if (game.scale.width !== logicalWidth || game.scale.height !== roomHeight)
    game.scale.setGameSize(logicalWidth, roomHeight);
}

/** A public room switch can change logical dimensions without recreating the game or observers. */
// eslint-disable-next-line max-lines-per-function -- Raumwechsel aktualisiert Datenanker, CSS-Verhältnis und Canvas zusammen.
export function configureRoomHost(game: Phaser.Game, width: number, height: number) {
  const host = game.canvas.parentElement;

  if (!host) return;
  host.dataset.roomWidth = String(width);
  host.dataset.roomHeight = String(height);
  host.style.aspectRatio = `${width} / ${height}`;
  host.style.setProperty('--room-ratio', String(width / height));
  host.closest('main')?.style.setProperty('--room-ratio', String(width / height));
  const box = host.getBoundingClientRect();

  resizeHost(game, box.width, box.height);
}
