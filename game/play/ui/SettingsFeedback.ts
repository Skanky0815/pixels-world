import { t, type TextKey } from '../../shared/i18n/locale';

const controls =
  '[data-audio], [data-difficulty], [data-wasd], [data-reduce-motion], [data-remember-album]';

/** Confirms applied session settings; asynchronous update/offline actions own their status. */
export class SettingsFeedback {
  private readonly root = document.createElement('p');
  private message: TextKey = 'settingsAutoApply';

  // eslint-disable-next-line max-lines-per-function -- Status und delegierte Eingaben teilen den Lebenszyklus des vorhandenen Menüs.
  constructor(
    host: HTMLElement,
    private readonly started: () => boolean,
    signal: AbortSignal,
  ) {
    this.root.className = 'menu-settings-feedback';
    this.root.hidden = true;
    this.root.setAttribute('role', 'status');
    this.root.setAttribute('aria-atomic', 'true');
    host.querySelector('.menu-settings')?.before(this.root);
    host.addEventListener('change', (event) => this.changed(event), { signal });
    host.addEventListener('click', (event) => this.languageChanged(event), { signal });
  }

  show(visible: boolean) {
    this.root.hidden = !visible;
    this.message = 'settingsAutoApply';
    this.render();
  }

  render() {
    this.root.dataset.state = this.message === 'settingsAutoApply' ? 'idle' : 'applied';
    this.root.replaceChildren(document.createTextNode(t(this.message)));
  }

  private changed(event: Event) {
    if (!(event.target instanceof Element) || !event.target.matches(controls)) return;
    const nextRound = event.target.matches('[data-difficulty]') && this.started();

    this.confirm(nextRound ? 'settingsAppliedNextRound' : 'settingsApplied');
  }

  private languageChanged(event: MouseEvent) {
    if (event.target instanceof Element && event.target.closest('[data-language]'))
      this.confirm('settingsApplied');
  }

  private confirm(message: TextKey) {
    if (this.root.hidden) return;
    this.message = message;
    this.render();
  }
}
