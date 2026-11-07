import { onLanguageChange, t, type TextKey } from '../i18n/locale';
import './install.css';

interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export class InstallApp {
  private readonly dialog = document.createElement('dialog');
  private prompt: InstallPrompt | undefined;

  // eslint-disable-next-line max-lines-per-function -- Browser-Installation und das native Hilfefenster teilen dieselbe Seitenlebensdauer.
  constructor(private readonly button: HTMLButtonElement) {
    this.dialog.className = 'install-dialog';
    this.dialog.innerHTML = markup();
    document.body.append(this.dialog);
    this.button.hidden = matchMedia('(display-mode: standalone)').matches;
    this.button.addEventListener('click', () => void this.install().catch(() => this.help()));
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.prompt = event as InstallPrompt;
    });
    window.addEventListener('appinstalled', () => {
      this.button.hidden = true;
    });
    onLanguageChange(() => this.refresh());
    this.refresh();
  }

  private async install() {
    const prompt = this.prompt;

    if (!prompt) return this.help();
    this.prompt = undefined;
    await prompt.prompt();

    if ((await prompt.userChoice).outcome === 'accepted') this.button.hidden = true;
  }

  private help() {
    if (!this.dialog.open) this.dialog.showModal();
  }

  private refresh() {
    this.button.textContent = t('installApp');
    this.dialog.setAttribute('aria-label', t('installApp'));

    for (const node of Array.from(this.dialog.querySelectorAll<HTMLElement>('[data-install-text]')))
      node.textContent = t(node.dataset.installText as TextKey);
  }
}

function markup() {
  return `<h2 data-install-text="installApp"></h2>
    <p data-install-text="installIphone"></p><p data-install-text="installBrowser"></p>
    <p data-install-text="installOffline"></p>
    <form method="dialog"><button data-install-text="closeInstall"></button></form>`;
}
