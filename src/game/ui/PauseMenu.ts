import { motionPreferences } from '../../settings/motion';
import { t, onLanguageChange, type TextKey } from '../../i18n/locale';
import { createLanguageSetting } from '../../i18n/language-setting';
import { audioPreferences, type AudioLevels } from '../../settings/audio';
import './pause-menu.css';

interface PauseActions {
  pause(paused: boolean): void;
  restart(): void;
  started(): boolean;
}

export class PauseMenu {
  private readonly root = document.createElement('dialog');
  private readonly toggle = document.createElement('button');
  private readonly abort = new AbortController();
  private readonly unsubscribe: () => void;
  private readonly unsubscribeAudio: () => void;
  private readonly removeLanguage: () => void;
  private readonly unsubscribeMotion: () => void;

  // eslint-disable-next-line max-lines-per-function -- Zugänglicher Dialog und sämtliche Ereignisse teilen eine szenengebundene Lebensdauer.
  constructor(private readonly actions: PauseActions) {
    this.root.className = 'pause-menu';
    this.root.innerHTML = markup();
    this.toggle.type = 'button';
    this.toggle.className = 'pause-toggle';
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

  private open() {
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

  private refresh() {
    this.root.setAttribute('aria-label', t('pauseSettings'));
    this.toggle.textContent = t('menu');

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

  destroy() {
    this.abort.abort();
    this.unsubscribe();
    this.unsubscribeAudio();
    this.unsubscribeMotion();
    this.removeLanguage();
    this.root.close();
    this.root.remove();
    this.toggle.remove();
  }
}

// eslint-disable-next-line max-lines-per-function -- Das kleine Menü bleibt mit zugehörigen Beschriftungen als ein deklarativer Aufbau lesbar.
function markup() {
  return `<h2 data-menu-text="pauseSettings"></h2>
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
      <button type="button" data-pause-restart data-menu-text="newRoundLabel"></button></div>`;
}
