import Phaser from 'phaser';
import './animation-compare.css';
import './interactable-playground.css';
import { PlaygroundScene } from './PlaygroundScene';
import { PLAYGROUND_OBJECTS } from './playground-room';

if (!import.meta.env.DEV)
  throw new Error('Interactable Playground ist nur im Dev-Betrieb verfügbar.');
const host = required<HTMLElement>('#game');
const select = required<HTMLSelectElement>('#playground-object');
const reset = required<HTMLButtonElement>('#playground-reset');
const diagnostics = required<HTMLElement>('#playground-diagnostics');
const kind = required<HTMLOutputElement>('#playground-kind');
const state = required<HTMLOutputElement>('#playground-state');
const score = required<HTMLOutputElement>('#playground-score');
const events = required<HTMLOListElement>('#playground-events');
const empty = required<HTMLElement>('#playground-empty');
const abort = new AbortController();
let eventKey = '';

for (const [key, definition] of Object.entries(PLAYGROUND_OBJECTS))
  select.add(new Option(`${definition.kind} · ${key}`, key));

const scene = new PlaygroundScene(render);
const game = new Phaser.Game({
  type: Phaser.CANVAS,
  parent: host,
  width: 800,
  height: 540,
  pixelArt: true,
  backgroundColor: '#cbb192',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 1000 }, debug: false } },
  scene,
});

select.addEventListener('change', restart, { signal: abort.signal });
reset.addEventListener('click', restart, { signal: abort.signal });
host.addEventListener('pointerdown', () => host.focus({ preventScroll: true }), {
  signal: abort.signal,
});
import.meta.hot?.dispose(() => {
  abort.abort();
  game.destroy(true);
});

function required<T extends HTMLElement>(selector: string) {
  const element = document.querySelector<T>(selector);

  if (!element) throw new Error(`Playground fehlt: ${selector}`);

  return element;
}

function restart() {
  select.disabled = reset.disabled = true;
  scene.scene.restart({ variant: select.value });
  host.focus({ preventScroll: true });
}

function render(snapshot: ReturnType<PlaygroundScene['snapshot']>) {
  select.disabled = reset.disabled = false;
  diagnostics.textContent = JSON.stringify(snapshot, null, 2);
  kind.value = `${snapshot.kind} · ${snapshot.variant}`;
  state.value = snapshot.object.state;
  score.value = String(snapshot.score);
  renderEvents(snapshot.events);
  document.documentElement.dataset.playgroundReady = 'true';
}

// eslint-disable-next-line max-lines-per-function -- Ereignisse erscheinen nur bei Änderungen und als Text, ohne HTML aus Inhaltsdaten auszuführen.
function renderEvents(log: ReturnType<PlaygroundScene['snapshot']>['events']) {
  const key = JSON.stringify(log);

  if (key === eventKey) return;
  eventKey = key;
  empty.hidden = log.length > 0;
  events.replaceChildren(
    ...log.map((event) => {
      const item = document.createElement('li');

      item.textContent = `${event.kind} · Stufe ${event.stage} · +${event.value} Punkte · ${event.objectId}`;

      return item;
    }),
  );
}
