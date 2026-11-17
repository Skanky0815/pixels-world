import { keyboardPreferences } from '../input/keyboard-preferences';
import {
  onLanguageChange,
  reportMissingTranslations,
  restoreLanguage,
  t,
  type TextKey,
} from './locale';

onLanguageChange(refresh);
restoreLanguage();
keyboardPreferences.subscribe(refreshKeyboard);
refreshKeyboard();

function refresh() {
  for (const node of Array.from(document.querySelectorAll<HTMLElement>('[data-i18n]')))
    node.textContent = t(node.dataset.i18n as TextKey);

  for (const node of Array.from(document.querySelectorAll<HTMLElement>('[data-i18n-label]')))
    node.setAttribute('aria-label', t(node.dataset.i18nLabel as TextKey));

  for (const node of Array.from(document.querySelectorAll<HTMLElement>('[data-i18n-title]')))
    node.title = t(node.dataset.i18nTitle as TextKey);
}

if (import.meta.env.DEV) {
  const missing = reportMissingTranslations();

  if (missing.length) console.warn('Missing English translations:', missing);
}

// eslint-disable-next-line max-lines-per-function -- Die statischen Bedienhinweise zeigen die aktuell gewählten Tasten aus derselben Präferenz.
function refreshKeyboard() {
  const wasd = keyboardPreferences.snapshot();

  refreshGameLabel(wasd);

  for (const node of Array.from(document.querySelectorAll<HTMLElement>('[data-keyboard-axis]'))) {
    const horizontal = node.dataset.keyboardAxis === 'horizontal';
    const labels = horizontal ? ['←', '→'] : ['↑', '↓'];

    if (wasd) labels.push(...(horizontal ? ['A', 'D'] : ['W', 'S']));
    node.replaceChildren(
      ...labels.map((label) => {
        const key = document.createElement('kbd');

        key.textContent = label;

        return key;
      }),
    );
  }
}

function refreshGameLabel(wasd: boolean) {
  const host = document.getElementById('game');
  const key = wasd ? 'pixelRoomWasd' : 'pixelSLivingRoomUseArrow';

  if (!host) return;
  host.dataset.i18nLabel = key;
  host.setAttribute('aria-label', t(key));
}
