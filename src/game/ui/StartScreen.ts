import { t, onLanguageChange, translateExact } from '../../i18n/locale';
import type { ResolvedGoal } from '../domain/main-goal';

/** Responsive introduction only; gameplay and keyboard transitions remain scene-owned. */
export class StartScreen {
  private readonly root: HTMLElement;
  private readonly unsubscribe: () => void;

  // eslint-disable-next-line max-lines-per-function -- Die zusammengehörige DOM-Initialisierung bindet Einführung, Zieltext und Sichtbarkeit atomar an den Spielbereich.
  constructor(
    visible: boolean,
    private readonly goal: ResolvedGoal,
    private readonly rooms: () => void,
  ) {
    const host = document.getElementById('game');

    if (!host) throw new Error('Game host missing');
    this.root = document.createElement('section');
    this.root.className = 'start-screen';
    this.root.addEventListener('keydown', this.buttonKey);
    this.root.addEventListener('keyup', this.buttonKey);
    this.root.addEventListener('click', (event) => {
      if (event.target instanceof Element && event.target.closest('[data-start-rooms]'))
        this.rooms();
    });
    this.root.setAttribute('aria-label', t('gameIntroduction'));
    this.root.innerHTML = introMarkup();
    this.describeGoal(goal);
    this.refreshAge();
    this.root.hidden = !visible;
    host.append(this.root);
    this.unsubscribe = onLanguageChange(() => this.refresh());
  }

  private describeGoal(goal: ResolvedGoal) {
    const text = this.root.querySelector('.start-goal-text');

    if (text) text.textContent = translateExact(goal.motivation);
  }

  private readonly buttonKey = (event: KeyboardEvent) => {
    if (
      !['Escape', 'F2'].includes(event.code) &&
      event.target instanceof Element &&
      event.target.closest('button')
    )
      event.stopPropagation();
  };

  private refresh() {
    const scroll = this.root.querySelector('.start-copy')?.scrollTop ?? 0;

    this.root.innerHTML = introMarkup();
    this.root.setAttribute('aria-label', t('gameIntroduction'));
    this.describeGoal(this.goal);
    this.refreshAge();
    this.root.querySelector('.start-copy')?.scrollTo(0, scroll);
  }

  hide() {
    this.root.hidden = true;
  }

  show() {
    this.root.hidden = false;
  }

  private refreshAge() {
    const age = document.querySelector('main > footer .age-rating')?.cloneNode(true);

    if (age) this.root.querySelector('[data-start-age]')?.replaceChildren(age);
  }

  snapshot() {
    return Object.freeze({ visible: !this.root.hidden });
  }

  destroy() {
    this.unsubscribe();
    this.root.remove();
  }
}

// eslint-disable-next-line max-lines-per-function -- Die statische zugängliche Einführung bleibt als vollständiger HTML-Aufbau zusammen lesbar.
function introMarkup() {
  return `<div class="start-copy">
    <h2>${t('readyPixel')}</h2>
    <aside class="start-goal" aria-label="${t('yourMainGoal')}">
      <strong>${t('yourMainGoal')}</strong>
      <p class="start-goal-text"></p>
    </aside>
    <dl class="start-controls">
      <div><dt>← →</dt><dd>${t('moveAndSteerInMidAir')}</dd></div>
      <div><dt><span class="space-key" role="img" aria-label="${t('spaceLabel')}">␣</span></dt><dd>${t('jumpAndLeapOffTheCurtain')}</dd></div>
      <div><dt>↑ ↓</dt><dd>${t('climbTheCurtain')}</dd></div>
    </dl>
  </div><p class="start-prompt"><span class="keyboard-prompt" role="img" aria-label="${t('pressSpaceToStart')}">${t('startShort')}</span>
  <span class="touch-prompt">${t('startTouchShort')}</span><button type="button" class="ui-button" data-start-rooms>${t('roomsBack')}</button></p>
  <footer class="start-age" data-start-age></footer>`;
}
