import { t, onLanguageChange, type TextKey } from '../i18n/locale';
import { publishedVersion } from './offline-storage';

const button = document.querySelector<HTMLButtonElement>('[data-recover-game]');
const status = document.querySelector<HTMLElement>('[data-recovery-status]');
let message: TextKey = 'recoveryReady';

if (button) button.addEventListener('click', () => void recover());

function show(key: TextKey) {
  message = key;

  if (status) status.textContent = t(key);
}

/** A new navigation is explicit; this page never changes workers, caches or saved game data. */
async function recover() {
  if (!button || button.disabled) return;
  button.disabled = true;
  show('recoveryChecking');

  try {
    await openFreshGame();
  } catch {
    failed();
  }
}

function failed() {
  show(navigator.onLine ? 'recoveryFailed' : 'recoveryOffline');

  if (button) button.disabled = false;
}

async function openFreshGame() {
  const version = await publishedVersion();
  const url = new URL('play.html', location.href);

  // Old releases precache the exact document URL and ignore only tracking parameters.
  // A per-attempt non-tracking parameter reaches fresh HTML without activating a worker.
  url.searchParams.set('fresh', `${version}-${Date.now()}`);
  location.assign(url.href);
}

show(message);
onLanguageChange(() => show(message));
