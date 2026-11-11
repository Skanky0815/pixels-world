import { closeButtonMarkup, configureCloseButton } from '../../ui/button';
import { difficultyPreferences } from '../../settings/difficulty';
import { DIFFICULTY_LABELS, isDifficulty, type Difficulty } from '../../content/difficulty';
import { motionPreferences } from '../../settings/motion';
import { t, onLanguageChange, type TextKey } from '../../i18n/locale';
import { createLanguageSetting } from '../../i18n/language-setting';
import { audioPreferences, type AudioLevels } from '../../settings/audio';
import './pause-menu.css';
import { AlbumResetSetting } from './AlbumResetSetting';
import { AlbumView } from './AlbumView';
import { actionButton, configureAction } from './game-action';

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
}

export class PauseMenu {
  private readonly album: AlbumView;
  private readonly albumReset: AlbumResetSetting;
  private readonly root = document.createElement('dialog');
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
      if (!this.root.open) this.actions.pause(false);
      const target = this.root.open
        ? this.element('[data-pause-album]')
        : document.getElementById('game');

      target?.focus({ preventScroll: true });
    });
    this.root.className = 'pause-menu';
    this.root.innerHTML = markup();
    this.albumReset = new AlbumResetSetting(this.element('[data-pause-album-reset]'));
    this.toggle.type = 'button';
    this.toggle.className = 'pause-toggle';
    configureAction(this.toggle, 'options');

    document.body.append(this.root);
    this.removeLanguage = createLanguageSetting(this.element('[data-pause-language]'));
    const options = { signal: this.abort.signal };

    this.mountHeader(options);

    this.element('[data-pause-album]').addEventListener('click', () => this.openAlbum(), options);
    this.toggle.addEventListener('click', () => this.open(), options);
    this.element('[data-pause-resume]').addEventListener('click', () => this.close(), options);
    this.element('[data-pause-restart]').addEventListener(
      'click',
      () => this.actions.restart(),
      options,
    );
    this.root.addEventListener(
      'cancel',
      (event) => {
        event.preventDefault();
        this.close();
      },
      options,
    );
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
    return this.root.open || this.album.opened;
  }

  private readonly menuKey = (event: KeyboardEvent) => {
    if (event.code !== 'Escape') event.stopPropagation();
  };

  private readonly keyDown = (event: KeyboardEvent) => {
    if (event.code !== 'Escape' || event.repeat) return;

    if (!this.opened && document.querySelector('dialog[open]')) return;
    event.preventDefault();

    if (this.opened) this.close();
    else this.open();
  };

  openAlbum() {
    this.actions.pause(true);
    this.album.open();
  }

  open() {
    if (this.opened || document.querySelector('dialog[open]')) return;
    this.actions.pause(true);
    this.refresh();
    this.albumReset.clearConfirmation();
    this.root.showModal();
  }

  private close() {
    if (!this.opened) return;
    this.root.close();
    this.actions.pause(false);
    document.getElementById('game')?.focus({ preventScroll: true });
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
    configureCloseButton(
      this.element('[data-pause-resume]') as HTMLButtonElement,
      t('optionsClose'),
    );
    configureAction(this.toggle, 'options');
    configureAction(this.albumToggle, 'album');
    configureAction(this.element('[data-pause-album]') as HTMLButtonElement, 'album');
    this.refreshDifficulty();
  }

  private refresh() {
    this.root.setAttribute('aria-label', t('pauseSettings'));
    this.refreshToggle();

    for (const element of Array.from(this.root.querySelectorAll<HTMLElement>('[data-menu-text]')))
      element.textContent = t(element.dataset.menuText as TextKey);
    this.element('[data-pause-restart]').hidden = !this.actions.started();
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
    this.unsubscribeDifficulty();
  }

  destroy() {
    this.album.destroy();
    this.albumReset.destroy();
    this.abort.abort();
    this.removeSubscriptions();
    this.removeLanguage();
    this.root.close();
    this.root.remove();
    this.headerActions.remove();
  }
}

// eslint-disable-next-line max-lines-per-function -- Das kleine Menü bleibt mit zugehörigen Beschriftungen als ein deklarativer Aufbau lesbar.
function markup() {
  return `<header class="popup-heading">${closeButtonMarkup(t('optionsClose'), 'data-pause-resume')}<h2 data-menu-text="pauseSettings"></h2></header>
    <section><label for="pause-difficulty"><span data-menu-text="difficultyLabel"></span></label>
      <select id="pause-difficulty" data-difficulty aria-describedby="difficulty-help difficulty-current">
        <option value="easy" data-menu-text="difficultyEasy"></option>
        <option value="normal" data-menu-text="difficultyNormal"></option>
        <option value="hard" data-menu-text="difficultyHard"></option>
      </select>
      <p id="difficulty-help" class="difficulty-help" aria-live="polite"></p>
      <p id="difficulty-current" data-difficulty-current></p></section>
    <section><h3 data-menu-text="language"></h3><div data-pause-language></div></section>
    <section><h3 data-menu-text="audioSettings"></h3>
      <label for="pause-master-volume"><span data-menu-text="masterVolume"></span><output data-audio-value="master"></output>
        <input id="pause-master-volume" type="range" data-audio="master" min="0" max="100" step="1"></label>
      <label for="pause-effects-volume"><span data-menu-text="effectsVolume"></span><output data-audio-value="effects"></output>
        <input id="pause-effects-volume" type="range" data-audio="effects" min="0" max="100" step="1"></label>
    </section>
    <section><label class="motion-setting"><input type="checkbox" data-reduce-motion><span data-menu-text="reduceMotion"></span></label>
      <p data-system-motion data-menu-text="systemMotion" hidden></p></section>
    <section data-pause-album-reset></section>
    <div class="pause-actions">${actionButton('album', 'data-pause-album')}
      <button type="button" class="ui-button" data-pause-restart data-menu-text="newRoundLabel"></button>
      <a class="ui-button" href="./" data-menu-text="quitGame"></a></div>`;
}
