import Phaser from 'phaser';

/** CSS grid can settle after the window resize event; track the actual game host. */
export function observeGameHost(game: Phaser.Game) {
  const observer = new ResizeObserver(([entry]) => {
    game.scale.setParentSize(entry.contentRect.width, entry.contentRect.height);
  });

  const host = game.canvas.parentElement;

  if (host) observer.observe(host);
  game.events.once(Phaser.Core.Events.DESTROY, () => observer.disconnect());
}
