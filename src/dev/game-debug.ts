import Phaser from 'phaser';
import './game-debug.css';
import {
  DEBUG_TARGETS,
  debugScenario,
  prepareDebugScenario,
  advanceDebugScenario,
  type DebugPort,
  type DebugScenario,
} from './game-debug-model';

if (!import.meta.env.DEV) throw new Error('GameDebug ist nur im Dev-Betrieb verfügbar.');

// eslint-disable-next-line max-lines-per-function -- Dialog, Tastenkürzel und Szenen-Listener teilen genau eine explizite Lebensdauer.
export function installGameDebug(scene: Phaser.Scene, port: DebugPort, initial?: DebugScenario) {
  const root = document.createElement('dialog');
  const toggle = document.createElement('button');
  const abort = new AbortController();

  root.className = 'game-debug';
  root.setAttribute('aria-label', 'Entwickler-Debugmodus');
  root.innerHTML = markup();
  toggle.type = 'button';
  toggle.textContent = 'Debug (F2)';
  toggle.className = 'game-debug-toggle';
  document.querySelector('#build-info')?.append(' · ', toggle);
  document.body.append(root);
  const form = element<HTMLFormElement>(root, 'form');
  const target = element<HTMLSelectElement>(root, '#debug-target');
  const status = element<HTMLElement>(root, '#debug-state');
  const forward = element<HTMLButtonElement>(root, '#debug-forward');
  let pending: DebugScenario['target'] | undefined;

  for (const [key, label] of Object.entries(DEBUG_TARGETS)) target.add(new Option(label, key));
  const close = () => {
    port.release();
    root.close();
    document.querySelector<HTMLElement>('#game')?.focus({ preventScroll: true });
  };

  const show = () => {
    port.release();

    if (root.open) close();
    else root.showModal();
  };

  const render = () => {
    if (pending && advanceDebugScenario(port, pending)) pending = undefined;

    if (!root.open) return;
    const state = port.read();

    status.textContent = JSON.stringify(state, null, 2);
    forward.disabled = !state.started || state.round.phase !== 'chaos';
  };

  toggle.addEventListener('click', show, { signal: abort.signal });
  document.addEventListener(
    'keydown',
    (event) => {
      if (event.code !== 'F2' || event.repeat) return;
      event.preventDefault();
      show();
    },
    { signal: abort.signal },
  );
  root.addEventListener(
    'cancel',
    (event) => {
      event.preventDefault();
      close();
    },
    { signal: abort.signal },
  );
  element<HTMLButtonElement>(root, '#debug-close').addEventListener('click', close, {
    signal: abort.signal,
  });
  forward.addEventListener(
    'click',
    () => {
      port.release();
      port.forward();
      render();
    },
    { signal: abort.signal },
  );
  form.addEventListener('submit', (event) => submit(event, form, port, root), {
    signal: abort.signal,
  });
  scene.events.on(Phaser.Scenes.Events.POST_UPDATE, render);

  if (initial) {
    const scenario = debugScenario(initial);
    const random = new Phaser.Math.RandomDataGenerator([String(scenario.seed)]);

    fillForm(form, scenario);
    prepareDebugScenario(port, scenario, () => random.frac());
    pending = ['reconciliation', 'result-success', 'result-failed'].includes(scenario.target)
      ? scenario.target
      : undefined;
    root.showModal();
  }

  render();

  return () => {
    abort.abort();
    scene.events.off(Phaser.Scenes.Events.POST_UPDATE, render);
    root.close();
    root.remove();

    if (toggle.previousSibling?.textContent === ' · ') toggle.previousSibling.remove();
    toggle.remove();
  };
}

function element<T extends HTMLElement>(root: HTMLElement, selector: string) {
  const found = root.querySelector<T>(selector);

  if (!found) throw new Error(`Debug-Feld fehlt: ${selector}`);

  return found;
}

function fillForm(form: HTMLFormElement, scenario: DebugScenario) {
  for (const [name, value] of Object.entries(scenario)) {
    const field = form.elements.namedItem(name);

    if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement)
      field.value = String(value);
  }
}

// eslint-disable-next-line max-lines-per-function -- Eine vollständige Formularvalidierung erfolgt vor dem destruktiven Szenenneustart und zeigt Eingabefehler lokal.
function submit(
  event: SubmitEvent,
  form: HTMLFormElement,
  port: DebugPort,
  root: HTMLDialogElement,
) {
  event.preventDefault();
  const values = new FormData(form);

  try {
    port.restart(
      debugScenario({
        target: String(values.get('target')) as DebugScenario['target'],
        score: Number(values.get('score')),
        seconds: Number(values.get('seconds')),
        seed: Number(values.get('seed')),
      }),
    );
  } catch (error) {
    element(root, '#debug-error').textContent =
      error instanceof Error ? error.message : String(error);
  }
}

// eslint-disable-next-line max-lines-per-function -- Beschriftetes DEV-Formular und Hinweise bleiben als deklarativer, zugänglicher Aufbau zusammen.
function markup() {
  return `<header><h2>Entwickler-Debugmodus</h2><button id="debug-close" type="button">Schließen · F2</button></header>
    <p>Nur DEV. Die Runde läuft weiter. Szenarien starten die aktuelle Runde neu;
    der gewählte Chaoswert ist synthetisch, Gegenstände bleiben unbeschädigt.</p>
    <form>
      <label>Zielphase<select id="debug-target" name="target"></select></label>
      <label>Chaoswert<input name="score" type="number" min="0" max="10000" step="1" value="0" required></label>
      <label>Startzeit in Sekunden<input name="seconds" type="number" min="1" max="600" step="1" value="90" required></label>
      <label>Seed<input name="seed" type="number" min="0" max="4294967295" step="1" value="42" required></label>
      <button type="submit">Szenario neu starten</button>
    </form>
    <p>Heimkehr und Reaktion folgen den echten Übergängen. Für Versöhnung und Ergebnis
    geht Pixel zuerst selbstständig zu Sara; derselbe Seed wiederholt Spruch und Pfeilfolgen.</p>
    <button id="debug-forward" type="button" disabled>Rundentimer +10 Sekunden</button>
    <p id="debug-error" role="alert"></p>
    <details open><summary>Live-Zustand</summary><pre id="debug-state"></pre></details>`;
}
