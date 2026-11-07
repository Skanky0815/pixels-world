import './dev-shell.css';
import './animation-compare.css';
import { createPixelComparison } from './pixel-compare';
import { createSaraComparison } from './sara-compare';

if (!import.meta.env.DEV) throw new Error('Animationsvergleich ist nur im Dev-Betrieb verfügbar.');
const host = document.querySelector('#comparisons');
const saraHost = document.querySelector('#sara-comparisons');
const pause = document.querySelector<HTMLButtonElement>('#pause');
const step = document.querySelector<HTMLButtonElement>('#step');

if (!host || !saraHost || !pause || !step) throw new Error('Vergleichsansicht unvollständig');
host.replaceChildren();
saraHost.replaceChildren();
const comparisons = await Promise.all([
  createPixelComparison(host),
  createSaraComparison(saraHost),
]);
const abort = new AbortController();
let paused = false;
let lastTime = performance.now();
let frame = 0;

pause.addEventListener(
  'click',
  () => {
    paused = !paused;
    pause.textContent = paused ? 'Alle weiterlaufen' : 'Alle anhalten';
    step.disabled = !paused;
    comparisons.forEach((comparison) => comparison.setGlobalPaused(paused));
  },
  { signal: abort.signal },
);
step.addEventListener('click', () => comparisons.forEach((comparison) => comparison.step()), {
  signal: abort.signal,
});

function tick(time: number) {
  const delta = time - lastTime;

  lastTime = time;
  comparisons.forEach((comparison) => comparison.draw(delta));
  frame = requestAnimationFrame(tick);
}

import.meta.hot?.dispose(() => {
  cancelAnimationFrame(frame);
  abort.abort();
  comparisons.forEach((comparison) => comparison.destroy());
});
document.documentElement.dataset.ready = 'true';
frame = requestAnimationFrame(tick);
