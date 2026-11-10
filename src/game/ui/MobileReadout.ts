import { MobileResultCard } from './MobileResultCard';
import { t } from '../../i18n/locale.ts';
import type { GameHud } from './GameHud';
import type { ReconciliationView } from './ReconciliationView';
import type { ResultViewSnapshot } from './RoundResultView';
import { DIALOGUE_PORTRAITS } from '../assets/dialogue-portraits';
import type { DialoguePortrait } from '../domain/dialogue-portrait';
interface Readout {
  readonly started: boolean;
  readonly hud: ReturnType<GameHud['snapshot']>;
  readonly goal: string;
  readonly homecoming: string;
  readonly dialogue: string;
  readonly portrait: DialoguePortrait | null;
  readonly welcome: boolean;
  readonly charmStage: string;
  readonly charm: ReturnType<ReconciliationView['readableText']>;
  readonly result: ResultViewSnapshot;
  readonly remaining: number;
  readonly feedback: { readonly text: string; readonly tone: string };
}
/** CSS-pixel text from the scene-owned views, independent of room/canvas scaling. */
export class MobileReadout {
  private readonly hud = document.createElement('section');
  private readonly goal = document.createElement('p');
  private readonly status = document.createElement('p');
  private readonly score = document.createElement('span');
  private readonly notice = document.createElement('span');
  private readonly panel = document.createElement('section');
  private readonly message = document.createElement('p');
  private readonly resultCard = new MobileResultCard();
  private readonly quote = document.createElement('p');
  private readonly hint = document.createElement('p');
  private readonly key = document.createElement('p');
  private readonly timer = document.createElement('progress');
  private readonly portrait = document.createElement('img');
  // eslint-disable-next-line max-lines-per-function -- Die rein lesende DOM-Ansicht bindet Textknoten und Lebensdauer gemeinsam an den Spielbereich.
  constructor() {
    this.hud.className = 'mobile-hud';
    this.hud.hidden = true;
    this.hud.setAttribute('aria-label', t('gameStatus'));
    this.goal.className = 'mobile-goal';
    this.status.setAttribute('role', 'status');
    this.notice.className = 'mobile-notice';
    this.status.append(this.score, this.notice);
    this.hud.append(this.status, this.goal);
    this.panel.className = 'mobile-dialogue';
    this.panel.setAttribute('aria-label', t('gameDialogue'));
    this.panel.hidden = true;
    this.portrait.className = 'mobile-portrait';
    this.portrait.alt = '';
    this.portrait.hidden = true;
    this.portrait.addEventListener('error', () => {
      this.portrait.hidden = true;
    });
    this.message.className = 'mobile-message';
    this.quote.className = 'mobile-quote';
    this.key.className = 'mobile-key';
    this.hint.className = 'mobile-hint';
    this.timer.max = 1;
    this.timer.setAttribute('aria-label', t('timeLeftForInput'));
    this.panel.append(
      this.portrait,
      this.message,
      this.resultCard.root,
      this.quote,
      this.key,
      this.timer,
      this.hint,
    );
    document.getElementById('play-area')?.prepend(this.hud);
    document.getElementById('game')?.append(this.panel);
  }

  // eslint-disable-next-line max-lines-per-function -- Die zusammengehörigen Textknoten und die Zeitleiste werden in einem Renderdurchlauf synchronisiert.
  render(state: Readout) {
    this.hud.setAttribute('aria-label', t('gameStatus'));
    this.hud.hidden = !state.started;
    this.panel.setAttribute('aria-label', t('gameDialogue'));
    this.timer.setAttribute('aria-label', t('timeLeftForInput'));
    setText(this.score, state.hud.scoreText);
    setText(this.notice, state.feedback.text);
    this.notice.dataset.feedback = state.feedback.tone;
    setText(this.goal, state.goal);
    this.resultCard.render(state.result);
    const text = panelText(state);

    this.panel.hidden = !text.message;
    this.panel.dataset.placement = state.welcome ? 'welcome' : 'dialogue';
    this.renderPortrait(text.portrait);
    setText(this.message, text.message);
    setText(this.quote, text.quote);
    setText(this.hint, text.hint);
    setText(this.key, text.key);
    this.timer.hidden = state.charmStage !== 'input';
    this.timer.value = state.remaining;
  }

  private renderPortrait(id: DialoguePortrait | null) {
    const url = id ? DIALOGUE_PORTRAITS[id] : undefined;

    if (this.portrait.getAttribute('src') !== url) {
      this.portrait.hidden = !url;

      if (url) this.portrait.src = url;
      else this.portrait.removeAttribute('src');
    }

    this.portrait.dataset.speaker = id?.startsWith('sara-') ? 'sara' : 'pixel';
    this.portrait.dataset.portrait = id ?? '';
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
      message: t('roundResult'),
      quote: s.result.quoteText,
      hint: t('newRoundStartsTheNextGame'),
      key: '',
      portrait: s.result.portrait,
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
      portrait: s.portrait,
    };
  }

  return { message: '', quote: '', hint: '', key: '', portrait: null };
}

function touchHint(text: string) {
  return text.replace(t('space'), t('continue'));
}
