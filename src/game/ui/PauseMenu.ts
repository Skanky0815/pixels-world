import { difficultyPreferences } from '../../settings/difficulty';
import { DIFFICULTY_LABELS, isDifficulty, type Difficulty } from '../../content/difficulty';
import { motionPreferences } from '../../settings/motion';
import { t, onLanguageChange, type TextKey } from '../../i18n/locale';
import { createLanguageSetting } from '../../i18n/language-setting';
import { audioPreferences, type AudioLevels } from '../../settings/audio';
import './pause-menu.css';

interface PauseActions {
  pause(paused: boolean): void;
  restart(): void;
  started(): boolean;
  difficulty(): Difficulty;
}

export class PauseMenu {
  private readonly root = document.createElement('dialog');
  private readonly toggle = document.createElement('button');
  private readonly abort = new AbortController();
  private readonly unsubscribe: () => void;
  private readonly unsubscribeAudio: () => void;
  private readonly removeLanguage: () => void;
  private readonly unsubscribeDifficulty: () => void;
  private readonly unsubscribeMotion: () => void;

  // eslint-disable-next-line max-lines-per-function -- Zugänglicher Dialog und sämtliche Ereignisse teilen eine szenengebundene Lebensdauer.
  constructor(private readonly actions: PauseActions) {
    this.root.className = 'pause-menu';
    this.root.innerHTML = markup();
    this.toggle.type = 'button';
    this.toggle.className = 'pause-toggle';
    this.toggle.innerHTML = menuIcon();
    this.toggle.setAttribute('aria-haspopup', 'dialog');
    document.querySelector('main > header')?.append(this.toggle);
    document.body.append(this.root);
    this.removeLanguage = createLanguageSetting(this.element('[data-pause-language]'));
    const options = { signal: this.abort.signal };

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

  get opened() {
    return this.root.open;
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

  open() {
    if (this.opened || document.querySelector('dialog[open]')) return;
    this.actions.pause(true);
    this.refresh();
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
    (this.element('[data-difficulty]') as HTMLSelectElement).value =
      difficultyPreferences.snapshot();
    this.element('[data-difficulty-current]').textContent = this.actions.started()
      ? t('difficultyCurrent', { v0: t(DIFFICULTY_LABELS[this.actions.difficulty()]) })
      : t('difficultyBeforeStart');
  }

  private refreshToggle() {
    const label = t('menu');

    this.toggle.setAttribute('aria-label', label);
    this.toggle.title = label;
    this.refreshDifficulty();
  }

  private refresh() {
    this.root.setAttribute('aria-label', t('pauseSettings'));
    this.refreshToggle();

    for (const element of Array.from(this.root.querySelectorAll<HTMLElement>('[data-menu-text]')))
      element.textContent = t(element.dataset.menuText as TextKey);
    this.element('[data-pause-resume]').textContent = t(
      this.actions.started() ? 'resumeGame' : 'closeSettings',
    );
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
    this.abort.abort();
    this.removeSubscriptions();
    this.removeLanguage();
    this.root.close();
    this.root.remove();
    this.toggle.remove();
  }
}

// eslint-disable-next-line max-lines-per-function -- Das kleine Menü bleibt mit zugehörigen Beschriftungen als ein deklarativer Aufbau lesbar.
function markup() {
  return `<h2 data-menu-text="pauseSettings"></h2>
    <section><label for="pause-difficulty"><span data-menu-text="difficultyLabel"></span></label>
      <select id="pause-difficulty" data-difficulty>
        <option value="easy" data-menu-text="difficultyEasy"></option>
        <option value="normal" data-menu-text="difficultyNormal"></option>
        <option value="hard" data-menu-text="difficultyHard"></option>
      </select><p data-difficulty-current></p></section>
    <section><h3 data-menu-text="language"></h3><div data-pause-language></div></section>
    <section><h3 data-menu-text="audioSettings"></h3>
      <label for="pause-master-volume"><span data-menu-text="masterVolume"></span><output data-audio-value="master"></output>
        <input id="pause-master-volume" type="range" data-audio="master" min="0" max="100" step="1"></label>
      <label for="pause-effects-volume"><span data-menu-text="effectsVolume"></span><output data-audio-value="effects"></output>
        <input id="pause-effects-volume" type="range" data-audio="effects" min="0" max="100" step="1"></label>
    </section>
    <section><label class="motion-setting"><input type="checkbox" data-reduce-motion><span data-menu-text="reduceMotion"></span></label>
      <p data-system-motion data-menu-text="systemMotion" hidden></p></section>
    <div class="pause-actions"><button type="button" data-pause-resume></button>
      <button type="button" data-pause-restart data-menu-text="newRoundLabel"></button>
      <a href="./" data-menu-text="quitGame"></a></div>`;
}

function menuIcon() {
  return `<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><path fill="currentColor" fill-rule="evenodd" d="M21.91,10.69 L21.91,13.31 L19.44,12.98 L17.95,16.57 L19.93,18.09 L18.09,19.93 L16.57,17.95 L12.98,19.44 L13.31,21.91 L10.69,21.91 L11.02,19.44 L7.43,17.95 L5.91,19.93 L4.07,18.09 L6.05,16.57 L4.56,12.98 L2.09,13.31 L2.09,10.69 L4.56,11.02 L6.05,7.43 L4.07,5.91 L5.91,4.07 L7.43,6.05 L11.02,4.56 L10.69,2.09 L13.31,2.09 L12.98,4.56 L16.57,6.05 L18.09,4.07 L19.93,5.91 L17.95,7.43 L19.44,11.02 Z M15.2,12 A3.2,3.2 0 1 0 8.8,12 A3.2,3.2 0 1 0 15.2,12 Z" /></svg>`;
}
