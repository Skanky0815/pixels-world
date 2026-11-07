import { t, onLanguageChange, currentLanguage } from '../../i18n/locale';
import type { ResolvedGoal } from '../domain/main-goal';
import bannerUrl from '../../../assets/banner.png?url';

/** Responsive introduction only; gameplay and keyboard transitions remain scene-owned. */
export class StartScreen {
  private readonly root: HTMLElement;
  private readonly unsubscribe: () => void;

  // eslint-disable-next-line max-lines-per-function -- Die zusammengehörige DOM-Initialisierung bindet Einführung, Zieltext und Sichtbarkeit atomar an den Spielbereich.
  constructor(
    visible: boolean,
    private readonly goal: ResolvedGoal,
  ) {
    const host = document.getElementById('game');

    if (!host) throw new Error('Game host missing');
    this.root = document.createElement('section');
    this.root.className = 'start-screen';
    this.root.setAttribute('aria-label', t('gameIntroduction'));
    this.root.innerHTML = introMarkup();
    this.describeGoal(goal);
    this.root.hidden = !visible;
    host.append(this.root);
    this.unsubscribe = onLanguageChange(() => this.refresh());
  }

  private describeGoal(goal: ResolvedGoal) {
    const text = this.root.querySelector('.start-goal-text');
    const seconds = (goal.dwellMs / 1000).toLocaleString(currentLanguage());

    if (text)
      text.textContent = t('secondsWithoutInput', {
        v0: goal.label,
        v1: goal.motivation,
        v2: seconds,
      });
  }

  private refresh() {
    const scroll = this.root.querySelector('.start-copy')?.scrollTop ?? 0;

    this.root.innerHTML = introMarkup();
    this.root.setAttribute('aria-label', t('gameIntroduction'));
    this.describeGoal(this.goal);
    this.root.querySelector('.start-copy')?.scrollTo(0, scroll);
  }

  hide() {
    this.root.hidden = true;
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
    <img src="${bannerUrl}" alt="Pixel’s World" width="2172" height="724" />
    <h2>${t('oneRoomOneCatYourChaos')}</h2>
    <p>${t('pixelIsHomeAloneWithA')}</p>
    <aside class="start-goal" aria-label="${t('yourMainGoal')}">
      <strong>${t('yourMainGoal')}</strong>
      <p class="start-goal-text"></p>
    </aside>
    <dl>
      <div><dt>← →</dt><dd>${t('moveAndSteerInMidAir')}</dd></div>
      <div><dt><span class="space-key" role="img" aria-label="${t('spaceLabel')}">␣</span></dt><dd>${t('jumpAndLeapOffTheCurtain')}</dd></div>
      <div><dt>↑ ↓</dt><dd>${t('climbTheCurtain')}</dd></div>
    </dl>
    <p>${t('makingAmendsPressTheBigArrow')}</p>
    <p class="touch-prompt">${t('theArrowsMovePixelAndGuide')}</p>
  </div><p class="start-prompt"><span class="keyboard-prompt" role="img" aria-label="${t('pressSpaceToStart')}">${t('pressSpaceToStart').replace(t('spaceLabel'), '␣')}</span>
  <span class="touch-prompt">${t('tapContinueToStart')}</span></p>`;
}
