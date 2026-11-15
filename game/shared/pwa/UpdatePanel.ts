import { t, onLanguageChange, type TextKey } from '../i18n/locale';
import { gameUpdates, type UpdateStatus } from './updates';
import './updates.css';

const LABELS = {
  unavailable: 'updatesUnavailable',
  idle: 'updatesIdle',
  checking: 'updatesChecking',
  current: 'updatesCurrent',
  offline: 'updatesOffline',
  error: 'updatesError',
  ready: 'updatesReady',
  applying: 'updatesApplying',
} as const satisfies Record<UpdateStatus, TextKey>;

export class UpdatePanel {
  private readonly abort = new AbortController();
  private readonly unsubscribe: () => void;
  private readonly removeLanguage: () => void;
  private postponed = false;

  // eslint-disable-next-line max-lines-per-function -- Die kleine Ansicht besitzt ihre Listener und bleibt vollständig im pausierenden Optionen-Menü.
  constructor(
    private readonly root: HTMLElement,
    private readonly toggle: HTMLElement,
  ) {
    root.className = 'game-updates';
    root.innerHTML = `<h3 data-update-version></h3><button type="button" class="ui-button" data-update-check></button>
      <p role="status" data-update-status></p><div data-update-offer hidden>
      <p data-update-warning></p><div class="update-actions"><button type="button" class="ui-button" data-update-later></button>
      <button type="button" class="ui-button" data-update-apply></button></div></div>`;
    const options = { signal: this.abort.signal };

    this.element('[data-update-check]').addEventListener('click', () => this.check(), options);
    this.element('[data-update-apply]').addEventListener(
      'click',
      () => {
        void gameUpdates.apply();
      },
      options,
    );
    this.element('[data-update-later]').addEventListener(
      'click',
      () => {
        this.postponed = true;
        this.refresh();
      },
      options,
    );
    this.unsubscribe = gameUpdates.subscribe(() => this.refresh());
    this.removeLanguage = onLanguageChange(() => this.refresh());
  }

  showAvailable() {
    this.postponed = false;
    this.refresh();
  }

  private check() {
    this.postponed = false;
    this.refresh();
    void gameUpdates.check(true);
  }

  // eslint-disable-next-line max-lines-per-function -- Status, Beschriftungen und Eingabesperre werden aus demselben unveränderlichen Snapshot abgeleitet.
  private refresh() {
    const { status, available } = gameUpdates.snapshot();
    const busy = status === 'checking' || status === 'applying';

    this.element('[data-update-version]').textContent = t('updatesVersion', {
      v0: __APP_VERSION__,
    });
    this.element('[data-update-status]').textContent = t(LABELS[status]);
    this.element('[data-update-warning]').textContent = t('updatesWarning');
    this.button(
      '[data-update-check]',
      available ? 'updatesShow' : 'updatesCheck',
      busy || status === 'unavailable',
    );
    this.button('[data-update-later]', 'updatesLater', busy);
    this.button('[data-update-apply]', 'updatesApply', busy);
    this.element('[data-update-offer]').hidden = !available || this.postponed;
    this.toggle.dataset.updateReady = String(available);
    this.toggle.setAttribute('aria-description', available ? t('updatesReady') : '');
  }

  private button(selector: string, key: TextKey, disabled: boolean) {
    const button = this.element(selector) as HTMLButtonElement;

    button.textContent = t(key);
    button.disabled = disabled;
  }

  private element(selector: string) {
    const element = this.root.querySelector<HTMLElement>(selector);

    if (!element) throw new Error(`Update panel element missing: ${selector}`);

    return element;
  }

  destroy() {
    this.abort.abort();
    this.unsubscribe();
    this.removeLanguage();
  }
}
