import { t } from '../../i18n/locale.ts';
import { compactVisibility } from './compact-visibility';
import { DialoguePortrait, placeDialogueText } from './DialoguePortrait';
import { charmPortrait } from '../domain/dialogue-portrait';
import type Phaser from 'phaser';
import { ARROW_LABELS, CHARM_LINES } from '../../content/reconciliation';
import type { ReconciliationSnapshot } from '../domain/reconciliation';
import { homecomingPositions } from '../content/homecoming-layout';
/** Reading and timed input are visually separate; only the current arrow needs attention. */
export class ReconciliationView {
  private readonly removeCompactListener: () => void;
  private readonly root: Phaser.GameObjects.Container;
  private readonly message: Phaser.GameObjects.Text;
  private readonly quote: Phaser.GameObjects.Text;
  private readonly hint: Phaser.GameObjects.Text;
  private readonly affection: Phaser.GameObjects.Text;
  private readonly key: Phaser.GameObjects.Text;
  private readonly tile: Phaser.GameObjects.Rectangle;
  private readonly timer: Phaser.GameObjects.Rectangle;
  private readonly timeTrack: Phaser.GameObjects.Rectangle;
  private readonly heartLabel: Phaser.GameObjects.Text;
  private readonly hearts: Phaser.GameObjects.Rectangle;
  private readonly portrait: DialoguePortrait;
  private selectedPortrait: ReturnType<typeof charmPortrait> = null;
  // eslint-disable-next-line max-lines-per-function -- Deklarativer Aufbau trennt Lesetext, große Tastenkachel, zugehörige Zeit und Herzfortschritt räumlich.
  constructor(scene: Phaser.Scene, width: number, floorY: number) {
    this.root = scene.add.container(0, 0).setDepth(14).setVisible(false);
    const panel = scene.add.rectangle(width / 2, 235, width - 80, 218, 0x403a35, 1);

    panel.setStrokeStyle(2, 0xd4b488);
    this.message = scene.add.text(60, 140, '', { ...style(16), wordWrap: { width: width - 120 } });
    this.quote = scene.add.text(60, 188, '', {
      ...style(16),
      fontStyle: 'italic',
      color: '#e4c182',
      wordWrap: { width: width - 120 },
    });
    this.hint = scene.add.text(width - 60, 330, '', style(14)).setOrigin(1, 1);
    this.tile = scene.add.rectangle(width / 2, 242, 100, 100, 0x615047).setStrokeStyle(3, 0xe4c182);
    this.key = scene.add.text(width / 2, 242, '', style(76)).setOrigin(0.5);
    this.timeTrack = scene.add.rectangle(width / 2 - 70, 306, 140, 8, 0x66554e).setOrigin(0, 0.5);
    this.timer = scene.add.rectangle(width / 2 - 70, 306, 1, 8, 0xe4c182).setOrigin(0, 0.5);
    const heartTrack = scene.add.rectangle(60, 331, 200, 8, 0x66554e).setOrigin(0, 0.5);

    this.heartLabel = scene.add.text(60, 311, '', style(12));
    this.hearts = scene.add.rectangle(60, 331, 1, 8, 0xd99b9c).setOrigin(0, 0.5);
    this.affection = scene.add
      .text(homecomingPositions(width).pixelSeatX, floorY - 120, '', style(18))
      .setOrigin(0.5);
    this.portrait = new DialoguePortrait(scene, 100, 180);
    const dialogue = scene.add.container(0, 0, [
      panel,
      this.portrait.image,
      this.message,
      this.quote,
      this.hint,
      this.tile,
      this.key,
      this.timeTrack,
      this.timer,
      heartTrack,
      this.heartLabel,
      this.hearts,
    ]);

    this.removeCompactListener = compactVisibility(dialogue);
    this.root.add([dialogue, this.affection]);
  }

  render(snapshot: ReconciliationSnapshot) {
    this.root.setVisible(!['waiting', 'complete', 'failed'].includes(snapshot.stage));
    this.renderText(charmText(snapshot));
    this.renderPortrait(snapshot);
    this.hearts.width = 200 * snapshot.progress;
    this.heartLabel.setText(heartText(snapshot));
    this.renderKey(snapshot);
    this.affection.setText(affectionText(snapshot));
  }

  private renderPortrait(snapshot: ReconciliationSnapshot) {
    this.selectedPortrait = charmPortrait(snapshot);
    const textX = this.portrait.render(this.selectedPortrait) ? 160 : 60;

    placeDialogueText(this.message, textX, this.hint.x - textX);
    placeDialogueText(this.quote, textX, this.hint.x - textX);
    this.quote.setY(this.message.y + this.message.height + 8);
  }

  private renderText(text: string) {
    const lines = text.split('\n');
    const quoteIndex = lines.findIndex((line) => line.startsWith('Sara:'));

    this.message.setText(
      lines.filter((line) => !line.startsWith('Sara:') && !isHint(line)).join('\n'),
    );
    this.quote.setText(quotedLine(lines[quoteIndex])).setY(140 + Math.max(0, quoteIndex) * 24);
    this.hint.setText(lines.find(isHint) ?? '');
  }

  private renderKey(s: ReconciliationSnapshot) {
    const active = s.stage === 'input';
    const preparing = s.stage === 'cue';

    this.tile.setVisible(active || preparing);
    this.key.setText(s.expected ? ARROW_LABELS[s.expected] : '…').setVisible(active || preparing);
    this.timeTrack.setVisible(active);
    this.timer.setVisible(active);
    this.timer.width = active ? (140 * s.remainingMs) / s.inputMs : 0;
  }

  readableText() {
    return {
      message: this.message.text,
      quote: this.quote.text,
      hint: this.hint.text,
      key: this.key.visible ? this.key.text : '',
      hearts: this.heartLabel.text,
      portrait: this.selectedPortrait,
    };
  }

  snapshot() {
    return Object.freeze({
      heartsText: this.heartLabel.text,
      canvasTextVisible: this.root.visible && this.message.parentContainer.visible,
      portrait: this.portrait.snapshot(),
    });
  }

  destroy() {
    this.removeCompactListener();
    this.root.destroy(true);
  }
}

function style(size: number) {
  return { fontFamily: 'monospace', fontSize: `${size}px`, color: '#fff1cf', lineSpacing: 8 };
}

function charmText(s: ReconciliationSnapshot) {
  if (s.stage === 'failed') return t('stillInTroubleSaraNotEven');

  if (s.stage === 'complete') return t('forgivenSaraComeHereYouLittle');

  if (s.stage === 'finale') return t('allForgivenSaraPetsPixelPeace');

  if (s.stage === 'input')
    return t('pressTheArrowStepOfAttempts', { v0: s.step + 1, v1: s.length, v2: s.attemptsLeft });

  if (s.stage === 'cue') return t('getReadyTheNextArrowIs');

  return readingText(s);
}

function readingText(s: ReconciliationSnapshot) {
  if (s.stage === 'reading') return t('pixelSCharmOffensivePressThe');

  return t('attemptsLeftSpaceContinue', {
    v0: feedbackText(s.feedback),
    v1: s.attemptsLeft,
    v2: saraLine(s),
  });
}

function feedbackText(feedback: ReconciliationSnapshot['feedback']) {
  return {
    wrong: t('wrongArrowNoHeartLost'),
    timeout: t('timeSUpNoHeartLost'),
    sequence: t('sequenceCompleteOneMoreHeart'),
    none: '',
    correct: t('correct'),
  }[feedback];
}

function saraLine(s: ReconciliationSnapshot) {
  if (s.feedback === 'wrong' || s.feedback === 'timeout') return t('saraEasyNowGiveItAnother');

  return t('saraLabel046', { v0: CHARM_LINES[s.level][s.successes % 2] });
}

function affectionText(s: ReconciliationSnapshot) {
  if (s.stage === 'finale' || s.stage === 'complete')
    return t('pets', { v0: '♥ '.repeat(s.required).trim() });

  if (s.feedback === 'sequence') return t('nuzzle');

  return s.feedback === 'correct' ? t('purr') : '';
}

function isHint(line: string) {
  return line.startsWith(t('space')) || line.startsWith(t('rNewRound'));
}

function quotedLine(line: string | undefined) {
  return line ? t('saraLabel049', { v0: line.slice('Sara: '.length) }) : '';
}

function heartText(s: ReconciliationSnapshot) {
  const filled = '♥'.repeat(s.successes);
  const empty = '♡'.repeat(s.required - s.successes);

  return `${filled}${empty} · ${s.successes}/${s.required}`;
}
