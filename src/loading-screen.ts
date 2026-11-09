import type Phaser from 'phaser';
import { onLanguageChange, t, type TextKey } from './i18n/locale';
import { motionPreferences } from './settings/motion';

/** This controller and the HTML shell load before Phaser and its assets. */
class LoadingScreen {
  private readonly root = document.querySelector<HTMLElement>('#loading-screen');
  private readonly main = document.querySelector('main');
  private readonly unsubscribeLanguage: () => void;
  private readonly unsubscribeMotion: () => void;
  private broken = false;
  private readonly shownAt = performance.now();
  private timer: number | undefined;
  private onReady: (() => void) | undefined;
  private readonly skipKey = (event: KeyboardEvent) => {
    if (event.code !== 'Space' || event.repeat || !this.onReady || this.broken) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    this.finish();
  };

  constructor() {
    this.unsubscribeLanguage = onLanguageChange(() => this.refresh());
    this.unsubscribeMotion = motionPreferences.subscribe(() => this.refreshMotion());
    this.root?.querySelector('#loading-retry')?.addEventListener('click', () => location.reload());
    this.root?.querySelector('#loading-skip')?.addEventListener('click', () => this.skip());
    window.addEventListener('keydown', this.skipKey, true);
    this.refresh();
    this.refreshMotion();
  }

  get blocking() {
    return !!this.root?.isConnected;
  }

  get failed() {
    return this.broken;
  }

  // eslint-disable-next-line max-lines-per-function -- Fortschritt, Fehler und Abmeldung teilen die Lebensdauer eines echten Phaser-Ladevorgangs.
  track(loader: Phaser.Loader.LoaderPlugin) {
    if (!this.root?.isConnected) return;
    const progress = (value: number) => this.progress(value);
    const error = () => this.fail();

    loader.on('progress', progress);
    loader.on('loaderror', error);
    loader.once('complete', () => {
      loader.off('progress', progress);
      loader.off('loaderror', error);
    });
    this.root.dataset.phase = 'assets';
    this.progress(0);
    this.refresh();
  }

  progress(value: number) {
    if (!this.root?.isConnected || this.broken) return;
    const percent = Math.round(Math.max(0, Math.min(1, value)) * 100);

    this.root.querySelector('#loading-progress')?.setAttribute('aria-valuenow', String(percent));
    this.root.style.setProperty('--loading-progress', `${percent}%`);
    this.text('#loading-percent', `${percent} %`);
  }

  fail() {
    if (!this.root?.isConnected) return;
    this.broken = true;
    window.clearTimeout(this.timer);
    this.root.dataset.phase = 'error';
    this.root.setAttribute('aria-busy', 'false');
    this.root.querySelector('#loading-status')?.setAttribute('role', 'alert');
    this.refresh();
  }

  ready(onReady: () => void) {
    if (this.broken) return;

    if (!this.blocking) return onReady();

    this.onReady = onReady;

    if (this.root) this.root.dataset.phase = 'ready';
    this.refresh();
    const delay = Math.max(0, 2000 - (performance.now() - this.shownAt));

    this.timer = window.setTimeout(() => this.finish(), delay);
  }

  private skip() {
    if (this.onReady && !this.broken) this.finish();
  }

  // eslint-disable-next-line max-lines-per-function -- Timer, Tastaturbindung und einmaliger Bereitschafts-Callback enden gemeinsam.
  private finish() {
    if (this.broken || !this.onReady) return;
    const onReady = this.onReady;

    this.onReady = undefined;
    window.clearTimeout(this.timer);
    window.removeEventListener('keydown', this.skipKey, true);
    this.root?.remove();

    if (this.main) this.main.inert = false;
    this.unsubscribeLanguage();
    this.unsubscribeMotion();
    onReady();
  }

  private refresh() {
    this.text('#loading-title', t(this.broken ? 'loadingFailed' : 'loadingTitle'));
    this.text('#loading-status', t(this.statusKey()));
    this.text('#loading-retry', t('loadingRetry'));
    this.text('#loading-skip', t('loadingSkip'));
    this.refreshActions();
    this.root?.querySelector('#loading-progress')?.setAttribute('aria-label', t('loadingProgress'));
  }

  private refreshActions() {
    const skip = this.root?.querySelector<HTMLButtonElement>('#loading-skip');
    const retry = this.root?.querySelector<HTMLButtonElement>('#loading-retry');

    if (skip) skip.hidden = this.broken || !this.onReady;

    if (retry) retry.hidden = !this.broken;
  }

  private statusKey(): TextKey {
    if (this.broken) return 'loadingError';

    if (this.root?.dataset.phase === 'ready') return 'loadingReady';

    return this.root?.dataset.phase === 'assets' ? 'loadingAssets' : 'loadingStarting';
  }

  private refreshMotion() {
    if (this.root) this.root.dataset.reduced = String(motionPreferences.snapshot().reduced);
  }

  private text(selector: string, value: string) {
    const node = this.root?.querySelector(selector);

    if (node) node.textContent = value;
  }
}

export const loadingScreen = new LoadingScreen();
