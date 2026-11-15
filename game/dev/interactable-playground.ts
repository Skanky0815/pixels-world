import { installPlaygroundEditor } from './playground-editor';
import Phaser from 'phaser';
import './dev-shell.css';
import './interactable-playground.css';
import { PlaygroundScene } from './PlaygroundScene';
import {
  defaultPlaygroundSelection,
  parsePlaygroundSelection,
  playgroundChoices,
  playgroundGameLink,
  playgroundSelectionSearch,
  validatePlaygroundSelection,
  type PlaygroundSelection,
} from './playground-selection';
import {
  playgroundTargets,
  defaultPlaygroundTarget,
  type PlaygroundSnapshot,
  type PlaygroundTarget,
} from './playground-diagnostics';

if (!import.meta.env.DEV)
  throw new Error('Interactable Playground ist nur im Dev-Betrieb verfügbar.');
const host = required<HTMLElement>('#game');
const mode = required<HTMLSelectElement>('#playground-mode');
const select = required<HTMLSelectElement>('#playground-object');
const selectionLabel = required<HTMLElement>('#playground-selection-label');
const target = required<HTMLSelectElement>('#playground-target');
const round = required<HTMLElement>('#playground-round');
const gameLink = required<HTMLAnchorElement>('#playground-game-link');
const notice = required<HTMLElement>('#playground-notice');
const reset = required<HTMLButtonElement>('#playground-reset');
const diagnostics = required<HTMLElement>('#playground-diagnostics');
const kind = required<HTMLOutputElement>('#playground-kind');
const state = required<HTMLOutputElement>('#playground-state');
const score = required<HTMLOutputElement>('#playground-score');
const events = required<HTMLOListElement>('#playground-events');
const empty = required<HTMLElement>('#playground-empty');
const abort = new AbortController();
let eventKey = '';
let targetKey = '';
let viewKey = '';
let latest: PlaygroundSnapshot | undefined;
let expected = readInitialSelection();
const selectionLabels = {
  object: 'Objekt / Variante aus dem Spielkatalog',
  scenario: 'Grundaufbau',
};
const remembered = {
  object: defaultPlaygroundSelection('object').id,
  scenario: defaultPlaygroundSelection('scenario').id,
  [expected.mode]: expected.id,
};

fillChoices(expected);

const scene = new PlaygroundScene(render, expected);
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

const editor = installPlaygroundEditor(scene);

select.addEventListener('change', restart, { signal: abort.signal });
mode.addEventListener('change', changeMode, { signal: abort.signal });
target.addEventListener(
  'change',
  () => {
    if (latest) renderTargets(latest);
  },
  { signal: abort.signal },
);
reset.addEventListener('click', resetScene, { signal: abort.signal });
host.addEventListener('pointerdown', () => host.focus({ preventScroll: true }), {
  signal: abort.signal,
});
import.meta.hot?.dispose(() => {
  abort.abort();
  editor.destroy();
  game.destroy(true);
});

function required<T extends HTMLElement>(selector: string) {
  const element = document.querySelector<T>(selector);

  if (!element) throw new Error(`Playground fehlt: ${selector}`);

  return element;
}

function resetScene() {
  scene.scene.restart({});
  host.focus({ preventScroll: true });
}

function restart() {
  expected = validatePlaygroundSelection({ mode: selectedMode(), id: select.value });
  remembered[expected.mode] = expected.id;
  disableControls(true);
  notice.hidden = true;
  document.documentElement.dataset.playgroundReady = 'false';
  history.replaceState(null, '', selectionLocation());
  scene.scene.restart({ selection: expected, fresh: true });
  host.focus({ preventScroll: true });
}

function scenarioSeed() {
  return new URLSearchParams(location.search).get('room-seed') ?? undefined;
}

function selectionLocation() {
  const params = new URLSearchParams(playgroundSelectionSearch(expected));
  const seed = scenarioSeed();

  if (seed) params.set('room-seed', seed);

  return `?${params}`;
}

// eslint-disable-next-line max-lines-per-function -- Ein vollständiger Diagnoseframe synchronisiert Szene, Editor und sichtbare Ereignisse.
function render(snapshot: PlaygroundSnapshot) {
  if (snapshot.mode !== expected.mode || snapshot.variant !== expected.id) return;
  latest = snapshot;
  disableControls(false);
  renderView(snapshot);
  renderTargets(snapshot);
  editor.render(snapshot);
  score.value = String(snapshot.score);
  renderEvents(snapshot.events);
  document.documentElement.dataset.playgroundReady = 'true';
}

function selectedMode() {
  return mode.value === 'scenario' ? 'scenario' : 'object';
}

function disableControls(disabled: boolean) {
  mode.disabled = select.disabled = reset.disabled = target.disabled = disabled;
}

function changeMode() {
  const next = selectedMode();

  fillChoices({ mode: next, id: remembered[next] });
  restart();
}

function fillChoices(selection: PlaygroundSelection) {
  mode.value = selection.mode;
  selectionLabel.textContent = selectionLabels[selection.mode];
  select.replaceChildren(
    ...playgroundChoices(selection.mode).map((choice) => new Option(choice.label, choice.id)),
  );
  select.value = selection.id;
}

function readInitialSelection(): PlaygroundSelection {
  try {
    return parsePlaygroundSelection(location.search);
  } catch (error) {
    notice.textContent = `${error instanceof Error ? error.message : 'Ungültige Auswahl'}. Die Standard-Testszene wurde geladen.`;
    notice.hidden = false;

    return defaultPlaygroundSelection('object');
  }
}

// eslint-disable-next-line max-lines-per-function -- Szene und ausschließlich zum unveränderten Aufbau passender Rundenlink werden gemeinsam aktualisiert.
function renderView(snapshot: PlaygroundSnapshot) {
  const key = `${snapshot.mode}/${snapshot.variant}/${snapshot.generation}`;

  if (key === viewKey) return;
  viewKey = key;
  fitStage(snapshot);
  const link = playgroundGameLink(
    { mode: 'scenario', id: snapshot.room.id },
    scenarioSeed(),
    snapshot.layout,
  );

  round.hidden = !link;
  gameLink.href = link ?? '/play.html';
}

function fitStage(snapshot: PlaygroundSnapshot) {
  host.style.aspectRatio = `${snapshot.room.width} / ${snapshot.room.height}`;
  const bounds = host.getBoundingClientRect();

  scene.scale.setParentSize(bounds.width, bounds.height);
}

function renderTargets(snapshot: PlaygroundSnapshot) {
  const targets = playgroundTargets(snapshot);

  updateTargetOptions(snapshot, targets);
  const selected = targets.find((entry) => entry.id === target.value);

  kind.value = selected?.label ?? 'Keine Objekte';
  state.value = selected?.state.state ?? 'empty';
  diagnostics.textContent = JSON.stringify({ ...snapshot, diagnostic: selected }, null, 2);
}

function updateTargetOptions(snapshot: PlaygroundSnapshot, targets: PlaygroundTarget[]) {
  const key = `${snapshot.mode}/${snapshot.variant}/${snapshot.generation}/${targets.map((entry) => entry.id).join('/')}`;

  if (key === targetKey) return;
  targetKey = key;
  target.replaceChildren(...targets.map((entry) => new Option(entry.label, entry.id)));
  target.value = defaultPlaygroundTarget(snapshot, targets);
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
