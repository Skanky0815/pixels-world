import { loadingScreen } from '../loading-screen';
import { motionPreferences } from '../settings/motion';

const root = document.querySelector<HTMLElement>('#loading-screen');
const panel = document.createElement('div');

panel.className = 'loading-preview';
panel.innerHTML = `<label>Vorschau: <input type="range" min="0" max="100" value="45" aria-label="Ladefortschritt in der Vorschau"></label>
  <button type="button" data-preview-error>Fehler anzeigen</button>
  <label><input type="checkbox" data-preview-motion> Bewegung reduzieren</label>
  <a href="./play.html">Zum Spiel</a>`;
root?.querySelector('.loading-card')?.append(panel);

if (root) root.dataset.phase = 'assets';
loadingScreen.progress(0.45);
panel.querySelector('input[type="range"]')?.addEventListener('input', (event) => {
  loadingScreen.progress(Number((event.target as HTMLInputElement).value) / 100);
});
panel.querySelector('[data-preview-error]')?.addEventListener('click', () => loadingScreen.fail());
const motion = panel.querySelector<HTMLInputElement>('[data-preview-motion]');

if (motion) {
  motion.checked = motionPreferences.snapshot().reduced;
  motion.addEventListener('change', () => motionPreferences.setReduced(motion.checked));
}
