import { storageChoices } from '../../settings/storage';
import { onLanguageChange, t } from '../../i18n/locale';

/** Feature requests are independent; collection browsing never silently opts in. */
export class StoragePanel {
  private readonly abort = new AbortController();
  private readonly unsubscribe: () => void;
  private readonly language: () => void;
  private busy = false;
  private failed = false;

  // eslint-disable-next-line max-lines-per-function -- Dialogteil besitzt seine Ereignisse und Übersetzungs-Abonnements gemeinsam.
  constructor(private readonly root: HTMLElement) {
    root.addEventListener('change', (event) => this.change(event), { signal: this.abort.signal });
    root.addEventListener(
      'click',
      (event) => {
        void this.offline(event);
      },
      { signal: this.abort.signal },
    );
    this.unsubscribe = storageChoices.subscribe(() => this.render());
    this.language = onLanguageChange(() => this.render());
    this.render();
  }

  private change(event: Event) {
    if (event.target instanceof HTMLInputElement && event.target.matches('[data-remember-album]'))
      storageChoices.set('album', event.target.checked);
  }

  // eslint-disable-next-line max-lines-per-function -- Ein bewusster Offline-Auftrag umfasst Sperre, Dateizugriff und Fehleranzeige.
  private async offline(event: MouseEvent) {
    if (
      !(event.target instanceof Element) ||
      !event.target.closest('[data-offline-game]') ||
      this.busy
    )
      return;
    this.busy = true;
    this.failed = false;
    const enabled = !storageChoices.snapshot().offline;

    this.render();

    try {
      const { chooseOfflineGame } = await import('../../pwa/register');

      await chooseOfflineGame(enabled);
    } catch {
      this.failed = true;
    }

    this.busy = false;
    this.render();
  }

  private status() {
    if (this.failed) return 'storageFailed';

    if (this.busy) return 'storageBusy';

    return storageChoices.snapshot().offline ? 'storageOfflineEnabled' : 'storageOfflineHelp';
  }

  private render() {
    const choice = storageChoices.snapshot();
    const unavailable =
      !import.meta.env.PROD || import.meta.env.MODE === 'e2e' || !('serviceWorker' in navigator);

    this.root.innerHTML = `<h3>${t('storageTitle')}</h3>
      <label class="motion-setting"><input type="checkbox" data-remember-album ${choice.album ? 'checked' : ''}><span>${t('storageAlbum')}</span></label>
      <p>${t('storageAlbumHelp')}</p><button type="button" class="ui-button" data-offline-game ${unavailable || this.busy ? 'disabled' : ''}>${t(choice.offline ? 'storageOfflineRemove' : 'storageOfflineEnable')}</button>
      <p role="status">${t(this.status())}</p>`;
  }

  destroy() {
    this.abort.abort();
    this.unsubscribe();
    this.language();
  }
}
