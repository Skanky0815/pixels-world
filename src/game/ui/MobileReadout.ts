import type { GameHud } from './GameHud';
import type { ReconciliationView } from './ReconciliationView';
import type { ResultViewSnapshot } from './RoundResultView';

interface Readout {
  readonly hud: ReturnType<GameHud['snapshot']>;
  readonly goal: string;
  readonly homecoming: string;
  readonly dialogue: string;
  readonly charmStage: string;
  readonly charm: ReturnType<ReconciliationView['readableText']>;
  readonly result: ResultViewSnapshot;
  readonly remaining: number;
}

/** CSS-pixel text from the scene-owned views, independent of room/canvas scaling. */
export class MobileReadout {
  private readonly hud = document.createElement('section');
  private readonly goal = document.createElement('p');
  private readonly status = document.createElement('p');
  private readonly panel = document.createElement('section');
  private readonly message = document.createElement('p');
  private readonly quote = document.createElement('p');
  private readonly hint = document.createElement('p');
  private readonly key = document.createElement('p');
  private readonly timer = document.createElement('progress');

  // eslint-disable-next-line max-lines-per-function -- Die rein lesende DOM-Ansicht bindet Textknoten und Lebensdauer gemeinsam an den Spielbereich.
  constructor() {
    this.hud.className = 'mobile-hud';
    this.hud.setAttribute('aria-label', 'Spielstatus');
    this.goal.className = 'mobile-goal';
    this.hud.append(this.status, this.goal);
    this.panel.className = 'mobile-dialogue';
    this.panel.setAttribute('aria-label', 'Spieltext');
    this.panel.hidden = true;
    this.quote.className = 'mobile-quote';
    this.key.className = 'mobile-key';
    this.hint.className = 'mobile-hint';
    this.timer.max = 1;
    this.timer.setAttribute('aria-label', 'Verbleibende Eingabezeit');
    this.panel.append(this.message, this.quote, this.key, this.timer, this.hint);
    document.getElementById('play-area')?.prepend(this.hud);
    document.getElementById('game')?.append(this.panel);
  }

  // eslint-disable-next-line max-lines-per-function -- Die zusammengehörigen Textknoten und die Zeitleiste werden in einem Renderdurchlauf synchronisiert.
  render(state: Readout) {
    setText(
      this.status,
      `${compactScore(state.hud.scoreText)}\n${state.hud.roundText.replace(/ · R:.*/, '')}`,
    );
    setText(this.goal, state.goal);
    const text = panelText(state);

    this.panel.hidden = !text.message;
    setText(this.message, text.message);
    setText(this.quote, text.quote);
    setText(this.hint, text.hint);
    setText(this.key, text.key);
    this.timer.hidden = state.charmStage !== 'input';
    this.timer.value = state.remaining;
  }

  destroy() {
    this.hud.remove();
    this.panel.remove();
  }
}

function setText(node: HTMLElement, text: string) {
  if (node.textContent !== text) node.textContent = text;
}

// eslint-disable-next-line max-lines-per-function -- Die Priorität der bestehenden Ansichten bleibt als flache Darstellungsentscheidung sichtbar.
function panelText(s: Readout) {
  if (s.result)
    return {
      message: `RUNDENERGEBNIS\n${s.result.summaryText}`,
      quote: s.result.quoteText,
      hint: '„Neue Runde“ startet das nächste Spiel.',
      key: '',
    };

  if (!['waiting', 'complete', 'failed'].includes(s.charmStage))
    return {
      ...s.charm,
      message: `${s.charm.message}\n${s.charm.hearts}`,
      hint: touchHint(s.charm.hint),
    };

  if (!['waiting', 'complete'].includes(s.homecoming)) {
    const lines = s.dialogue.split('\n');

    return {
      message: lines[0] ?? '',
      quote: lines[1] ?? '',
      hint: touchHint(lines[2] ?? ''),
      key: '',
    };
  }

  return { message: '', quote: '', hint: '', key: '' };
}

function touchHint(text: string) {
  return text.replace('LEERTASTE:', 'Weiter:').replace('R:', 'Neustart:');
}

function compactScore(text: string) {
  return text
    .replace('  ·  SARAS ÄRGER (VORSCHAU):', '\nÄrger:')
    .replace('  ·  SARAS ÄRGER:', '\nÄrger:');
}
