import { StoragePanel } from './StoragePanel';
import { difficultyPreferences } from '../../settings/difficulty';
import { DIFFICULTY_LABELS, isDifficulty, type Difficulty } from '../../content/difficulty';
import { motionPreferences } from '../../settings/motion';
import { t, onLanguageChange, type TextKey } from '../../i18n/locale';
import { createLanguageSetting } from '../../i18n/language-setting';
import { audioPreferences, type AudioLevels } from '../../settings/audio';
import './pause-menu.css';
import { AlbumResetSetting } from './AlbumResetSetting';
import { AlbumView } from './AlbumView';
import { configureAction } from './game-action';
import { menuMarkup } from './menu-markup';
import { UpdatePanel } from '../../pwa/UpdatePanel';
import { gameInformation } from './game-information';

const DIFFICULTY_DESCRIPTIONS = {
  easy: 'difficultyEasyDescription',
  normal: 'difficultyNormalDescription',
  hard: 'difficultyHardDescription',
} as const satisfies Record<Difficulty, TextKey>;

interface PauseActions {
  pause(paused: boolean): void;
  restart(): void;
  started(): boolean;
  difficulty(): Difficulty;
  rooms(): void;
  play(): void;
}

export class PauseMenu {
  private view: 'home' | 'settings' | 'information' | 'confirm' = 'home';
  private returnable = true;
  private pending?: 'restart' | 'rooms';
  private readonly album: AlbumView;
  private readonly albumReset: AlbumResetSetting;
  private readonly storage: StoragePanel;
  private readonly updates: UpdatePanel;
  private readonly root = document.createElement('section');
  private readonly toggle = document.createElement('button');
  private readonly albumToggle = document.createElement('button');
  private readonly headerActions = document.createElement('div');
  private readonly abort = new AbortController();
  private readonly unsubscribe: () => void;
  private readonly unsubscribeAudio: () => void;
  private readonly removeLanguage: () => void;
  private readonly unsubscribeDifficulty: () => void;
  private readonly unsubscribeMotion: () => void;

  // eslint-disable-next-line max-lines-per-function -- Zugänglicher Dialog und sämtliche Ereignisse teilen eine szenengebundene Lebensdauer.
  constructor(private readonly actions: PauseActions) {
    this.album = new AlbumView(() => {
      if (this.root.hidden) this.actions.pause(false);
      const target = !this.root.hidden
        ? this.element('[data-pause-album]')
        : document.getElementById('game');

      target?.focus({ preventScroll: true });
    });
    this.root.className = 'pause-menu game-menu';
    this.root.hidden = true;
    this.root.inert = true;
    this.root.innerHTML = menuMarkup();
    this.albumReset = new AlbumResetSetting(this.element('[data-pause-album-reset]'));
    this.toggle.type = 'button';
    this.toggle.className = 'pause-toggle';
    configureAction(this.toggle, 'menu');

    document.getElementById('play-area')?.before(this.root);
    this.removeLanguage = createLanguageSetting(this.element('[data-pause-language]'));
    const options = { signal: this.abort.signal };

    this.mountHeader(options);
    this.storage = new StoragePanel(this.element('[data-pause-storage]'));
    this.updates = new UpdatePanel(this.element('[data-pause-updates]'), this.toggle);

    this.element('[data-pause-album]').addEventListener('click', () => this.openAlbum(), options);
    this.toggle.addEventListener('click', () => this.open(), options);
    this.element('[data-pause-resume]').addEventListener('click', () => this.close(), options);
    this.element('[data-pause-restart]').addEventListener(
      'click',
      () => this.ask('restart'),
      options,
    );
    this.element('[data-pause-rooms]').addEventListener('click', () => this.ask('rooms'), options);
    this.bindNavigation(options);
    this.element('[data-difficulty]').addEventListener(
      'change',
      () => this.changeDifficulty(),
      options,
    );
    this.unsubscribeDifficulty = difficultyPreferences.subscribe(() => this.refreshDifficulty());
    this.root.addEventListener('input', (event) => this.changeAudio(event), options);
    this.element('[data-reduce-motion]').addEventListener(
      'change',
      (event) => {
        if (event.target instanceof HTMLInputElement)
          motionPreferences.setReduced(event.target.checked);
      },
      options,
    );
    document.addEventListener('keydown', this.keyDown, options);
    this.root.addEventListener('keydown', this.menuKey, options);
    this.root.addEventListener('keyup', this.menuKey, options);
    this.unsubscribe = onLanguageChange(() => this.refresh());
    this.unsubscribeAudio = audioPreferences.subscribe(() => this.refreshAudio());
    this.unsubscribeMotion = motionPreferences.subscribe(() => this.refreshMotion());
    this.refresh();
    this.refreshAudio();
    this.refreshMotion();
  }

  private mountHeader(options: AddEventListenerOptions) {
    this.headerActions.className = 'game-menu-actions';
    this.albumToggle.type = 'button';
    this.albumToggle.className = 'album-toggle';
    configureAction(this.albumToggle, 'album');
    this.albumToggle.addEventListener('click', () => this.openAlbum(), options);
    this.headerActions.append(this.albumToggle, this.toggle);
    document.querySelector('main > header')?.append(this.headerActions);
  }

  get opened() {
    return !this.root.hidden || this.album.opened;
  }

  private readonly menuKey = (event: KeyboardEvent) => {
    if (event.code !== 'Escape') event.stopPropagation();
  };

  private readonly keyDown = (event: KeyboardEvent) => {
    if (event.code !== 'Escape' || event.repeat) return;

    if (document.querySelector('dialog[open]')) return;
    event.preventDefault();

    if (this.opened) this.close();
    else this.open();
  };

  enable() {
    this.root.inert = false;

    if (!this.root.hidden) this.focusView();
  }

  // eslint-disable-next-line max-lines-per-function -- Deklarative Zuordnung der Menünavigation an denselben Listener-Lebenszyklus.
  private bindNavigation(options: AddEventListenerOptions) {
    for (const [hook, action] of Object.entries({
      'data-menu-settings': () => this.show('settings'),
      'data-menu-information': () => this.show('information'),
      'data-menu-back': () => this.show('home'),
      'data-menu-play': () => {
        this.leave();
        this.actions.play();
      },
      'data-menu-confirm': () => this.confirm(),
      'data-menu-cancel': () => this.show('home'),
    }))
      this.element(`[${hook}]`).addEventListener('click', action, options);
  }

  open(initial = false) {
    if (this.album.opened || document.querySelector('dialog[open]')) return;

    if (this.root.hidden) this.returnable = !initial;
    this.actions.pause(true);
    this.root.hidden = false;
    document.documentElement.classList.add('menu-open');
    this.albumReset.clearConfirmation();
    this.show('home');
  }

  openAlbum() {
    this.actions.pause(true);
    this.album.open();
  }

  private close() {
    if (this.root.hidden) return;

    if (!this.returnable) return this.show('home');
    this.leave();
    document.getElementById('game')?.focus({ preventScroll: true });
  }

  dismiss() {
    if (!this.root.hidden) this.leave();
  }

  private leave() {
    this.root.hidden = true;
    document.documentElement.classList.remove('menu-open');
    this.actions.pause(false);
  }

  private show(view: typeof this.view) {
    this.view = view;
    this.refresh();

    for (const panel of Array.from(this.root.querySelectorAll<HTMLElement>('[data-menu-view]')))
      panel.hidden = panel.dataset.menuView !== view;
    this.element('[data-menu-back]').hidden = view === 'home' || view === 'confirm';
    this.element('.pause-actions').hidden = view === 'confirm';

    if (view === 'settings') this.updates.showAvailable();
    this.focusView();
  }

  private focusView() {
    const hooks = {
      confirm: '[data-menu-cancel]',
      settings: '[data-menu-back]',
      information: '[data-menu-back]',
      home: this.returnable ? '[data-pause-resume]' : '[data-menu-play]',
    };

    this.element(hooks[this.view]).focus({ preventScroll: true });
  }

  private ask(action: 'restart' | 'rooms') {
    if (!this.actions.started()) return this.actions[action]();
    this.pending = action;
    this.show('confirm');
  }

  private confirm() {
    const action = this.pending;

    this.pending = undefined;

    if (action) this.actions[action]();
  }

  private changeAudio(event: Event) {
    const input = event.target;

    if (input instanceof HTMLInputElement && input.dataset.audio)
      audioPreferences.update(input.dataset.audio as keyof AudioLevels, Number(input.value) / 100);
  }

  private refreshMotion() {
    const preference = motionPreferences.snapshot();
    const input = this.element('[data-reduce-motion]') as HTMLInputElement;

    input.checked = preference.reduced;
    input.disabled = preference.system;
    this.element('[data-system-motion]').hidden = !preference.system;
  }

  private refreshAudio() {
    const levels = audioPreferences.snapshot();

    for (const input of Array.from(this.root.querySelectorAll<HTMLInputElement>('[data-audio]'))) {
      input.value = String(Math.round(levels[input.dataset.audio as keyof AudioLevels] * 100));
      this.element(`[data-audio-value="${input.dataset.audio}"]`).textContent = `${input.value} %`;
    }
  }

  private changeDifficulty() {
    const select = this.element('[data-difficulty]') as HTMLSelectElement;

    if (isDifficulty(select.value)) difficultyPreferences.set(select.value);
  }

  private refreshDifficulty() {
    const difficulty = difficultyPreferences.snapshot();

    (this.element('[data-difficulty]') as HTMLSelectElement).value = difficulty;
    this.element('#difficulty-help').textContent = t(DIFFICULTY_DESCRIPTIONS[difficulty]);
    this.element('[data-difficulty-current]').textContent = this.actions.started()
      ? t('difficultyCurrent', { v0: t(DIFFICULTY_LABELS[this.actions.difficulty()]) })
      : t('difficultyBeforeStart');
  }

  private refreshToggle() {
    configureAction(this.toggle, 'menu');
    configureAction(this.albumToggle, 'album');
    this.element('[data-pause-album]').setAttribute('aria-label', t('albumOpen'));
    this.element('[data-pause-album]').textContent = t('albumTitle');
    this.refreshDifficulty();
  }

  private refresh() {
    this.root.setAttribute('aria-label', t('mainMenu'));
    this.element('.pause-actions').setAttribute('aria-label', t('mainMenu'));
    this.refreshHeading();
    this.refreshToggle();

    for (const element of Array.from(this.root.querySelectorAll<HTMLElement>('[data-menu-text]')))
      element.textContent = t(element.dataset.menuText as TextKey);
    this.refreshActions();
    this.element('[data-game-information]').replaceChildren(gameInformation());
  }

  private refreshHeading() {
    const keys = {
      home: 'menuReady',
      settings: 'pauseSettings',
      information: 'gameInformation',
      confirm: 'menuConfirmTitle',
    } as const;

    this.element('[data-menu-heading]').textContent = t(keys[this.view]);
  }

  private refreshActions() {
    this.element('[data-pause-restart]').hidden = !this.actions.started();
    this.element('[data-pause-rooms]').hidden = !this.actions.started();
    this.element('[data-menu-play]').hidden = this.returnable;
    this.element('[data-pause-resume]').hidden = !this.returnable;
  }

  private element(selector: string) {
    const element = this.root.querySelector<HTMLElement>(selector);

    if (!element) throw new Error(`Pause menu element missing: ${selector}`);

    return element;
  }

  private removeSubscriptions() {
    this.unsubscribe();
    this.unsubscribeAudio();
    this.unsubscribeMotion();
    this.updates.destroy();
    this.storage.destroy();
    this.unsubscribeDifficulty();
  }

  destroy() {
    this.album.destroy();
    this.albumReset.destroy();
    this.abort.abort();
    this.removeSubscriptions();
    this.removeLanguage();
    document.documentElement.classList.remove('menu-open');
    this.root.remove();
    this.headerActions.remove();
  }
}
