import Phaser from 'phaser';
import { followsPixel } from './camera-mode';

/** CSS grid can settle after the window resize event; track the actual game host. */
export function observeGameHost(game: Phaser.Game) {
  const observer = new ResizeObserver(([entry]) => {
    resizeHost(game, entry.contentRect.width, entry.contentRect.height);
  });

  const host = game.canvas.parentElement;

  if (host) observer.observe(host);
  game.events.once(Phaser.Core.Events.DESTROY, () => observer.disconnect());
}

function resizeHost(game: Phaser.Game, width: number, height: number) {
  if (width <= 0 || height <= 0) return;
  const roomHeight = Number(game.config.height);
  const logicalWidth = followsPixel() ? (roomHeight * width) / height : Number(game.config.width);

  game.scale.setParentSize(width, height);

  if (game.scale.width !== logicalWidth || game.scale.height !== roomHeight)
    game.scale.setGameSize(logicalWidth, roomHeight);
}
