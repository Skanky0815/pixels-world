import { t } from '../../i18n/locale.ts';
import type { ResultViewSnapshot } from './RoundResultView';

/** Readable result layout fed by the same final texts as the desktop card. */
export class MobileResultCard {
  readonly root = document.createElement('div');
  private readonly headline = document.createElement('p');
  private readonly chaos = document.createElement('p');
  private readonly reconciliation = document.createElement('p');
  private readonly hearts = document.createElement('span');
  private readonly goal = document.createElement('p');

  // eslint-disable-next-line max-lines-per-function -- Die kompakte DOM-Karte hält Ausgang, zwei Spalten und Zielstatus gemeinsam sichtbar.
  constructor() {
    this.root.className = 'mobile-result';
    this.root.hidden = true;
    this.headline.className = 'result-headline';
    this.chaos.className = 'result-chaos';
    this.reconciliation.className = 'result-reconciliation';
    this.hearts.className = 'result-hearts';
    this.goal.className = 'result-goal';
    const charm = document.createElement('div');

    charm.className = 'result-charm';
    charm.append(this.reconciliation, this.hearts);
    this.root.append(this.headline, this.chaos, charm, this.goal);
  }

  // eslint-disable-next-line max-lines-per-function -- Die unveränderlichen Ergebniswerte werden ohne HTML-Interpolation gemeinsam übertragen.
  render(result: ResultViewSnapshot) {
    this.root.hidden = result === null;

    if (!result) return;
    this.root.dataset.outcome = result.outcome;
    this.headline.textContent = result.headlineText;
    this.chaos.textContent = result.chaosText;
    this.reconciliation.textContent = result.reconciliationText;
    this.hearts.textContent = result.heartsText;
    this.hearts.dataset.count = String(result.required);
    this.hearts.setAttribute('role', 'img');
    this.hearts.setAttribute(
      'aria-label',
      t('resultHearts', { v0: result.hearts, v1: result.required }),
    );
    this.goal.textContent = result.goalText;
  }
}
