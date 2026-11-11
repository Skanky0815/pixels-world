import { albumCollection } from '../../settings/album';
import { onLanguageChange, t } from '../../i18n/locale';

/** Options own destructive collection actions; browsing the album never clears it. */
export class AlbumResetSetting {
  private readonly abort = new AbortController();
  private readonly unsubscribe: () => void;
  private confirming = false;

  constructor(private readonly root: HTMLElement) {
    this.root.addEventListener('click', (event) => this.click(event), {
      signal: this.abort.signal,
    });
    this.unsubscribe = onLanguageChange(() => this.render());
    this.render();
  }

  clearConfirmation() {
    this.confirming = false;
    this.render();
  }

  // eslint-disable-next-line max-lines-per-function -- Bestätigung und Fokuswechsel bleiben beim einzigen destruktiven Sammlungszugriff zusammen sichtbar.
  private click(event: MouseEvent) {
    const target =
      event.target instanceof Element
        ? event.target.closest<HTMLElement>('[data-album-reset]')
        : null;
    const action = target?.dataset.albumReset;

    if (!action) return;

    if (action === 'confirm' && this.confirming) albumCollection.reset();
    this.confirming = action === 'ask';
    this.render();
    this.root
      .querySelector<HTMLElement>(`[data-album-reset="${this.confirming ? 'cancel' : 'ask'}"]`)
      ?.focus();
  }

  private render() {
    const controls = this.confirming
      ? `<p id="album-reset-question" role="status">${t('albumResetQuestion')}</p><div class="album-reset-actions"><button type="button" class="ui-button" data-album-reset="confirm" aria-describedby="album-reset-question">${t('albumResetConfirm')}</button><button type="button" class="ui-button" data-album-reset="cancel">${t('albumCancel')}</button></div>`
      : `<button type="button" class="ui-button" data-album-reset="ask">${t('albumReset')}</button>`;

    this.root.innerHTML = `<h3>${t('albumTitle')}</h3>${controls}`;
  }

  destroy() {
    this.abort.abort();
    this.unsubscribe();
  }
}
