import { DIFFICULTY_LABELS } from '../../content/difficulty';
import { t } from '../../i18n/locale.ts';
import { compactVisibility } from './compact-visibility';
import type Phaser from 'phaser';
import type { RoundResult } from '../domain/round-result';
import { drawResultHearts } from './result-hearts';
import { DialoguePortrait, placeDialogueText } from './DialoguePortrait';
export type ResultViewSnapshot = ReturnType<RoundResultView['snapshot']>;
/** Scene-owned result card; the outcome and all values remain domain decisions. */
export class RoundResultView {
  private readonly removeCompactListener: () => void;
  private readonly root: Phaser.GameObjects.Container;
  private readonly dialogue: Phaser.GameObjects.Container;
  private readonly title: Phaser.GameObjects.Text;
  private readonly headline: Phaser.GameObjects.Text;
  private readonly chaos: Phaser.GameObjects.Text;
  private readonly reconciliation: Phaser.GameObjects.Text;
  private readonly hearts: Phaser.GameObjects.Graphics;
  private readonly goal: Phaser.GameObjects.Text;
  private readonly quote: Phaser.GameObjects.Text;
  private readonly hint: Phaser.GameObjects.Text;
  private result: RoundResult | null = null;
  private readonly portrait: DialoguePortrait;
  // eslint-disable-next-line max-lines-per-function -- Titel, hervorgehobener Ausgang und zwei Ergebnisspalten bilden eine gemeinsame deklarative Karte.
  constructor(scene: Phaser.Scene, width: number) {
    this.root = scene.add.container(0, 0).setDepth(16).setVisible(false);
    const panel = scene.add
      .rectangle(width / 2, 260, width - 80, 310, 0x403a35)
      .setStrokeStyle(2, 0xd4b488);

    this.title = scene.add.text(width / 2, 122, '', style(12)).setOrigin(0.5, 0);
    this.headline = scene.add.text(width / 2, 150, '', style(28)).setOrigin(0.5, 0);
    this.chaos = scene.add.text(64, 215, '', { ...style(16), wordWrap: { width: width / 2 - 90 } });
    this.reconciliation = scene.add.text(width / 2 + 20, 215, '', style(16));
    this.hearts = scene.add.graphics().setScale(1.75);
    this.goal = scene.add.text(64, 315, '', style(13));
    this.quote = scene.add.text(64, 344, '', {
      ...style(14),
      fontStyle: 'italic',
      color: '#e4c182',
      wordWrap: { width: width - 128 },
    });
    this.hint = scene.add.text(width - 60, 400, '', style(13)).setOrigin(1, 1);
    this.portrait = new DialoguePortrait(scene, 104, 358);
    this.dialogue = scene.add.container(0, 0, [
      panel,
      this.portrait.image,
      this.title,
      this.headline,
      this.chaos,
      this.reconciliation,
      this.hearts,
      this.goal,
      this.quote,
      this.hint,
    ]);
    this.removeCompactListener = compactVisibility(this.dialogue);
    this.root.add(this.dialogue);
  }

  render(result: RoundResult | null) {
    this.result = result;
    this.root.setVisible(result !== null);

    if (result) this.renderText(result);
  }

  // eslint-disable-next-line max-lines-per-function -- Beide Spalten und der Ausgang werden atomar in derselben Sprache aktualisiert.
  private renderText(result: RoundResult) {
    const success = result.outcome === 'success';

    this.title.setText(t('roundResult'));
    this.headline.setText(t(success ? 'resultFriendsAgain' : 'resultStillInTrouble'));
    this.headline.setColor(success ? '#c8dfa0' : '#efb69d');
    this.chaos.setText(t('resultChaosDetails', { v0: result.score, v1: result.reaction }));
    this.reconciliation.setText(
      t('resultReconciliation', { v0: t(success ? 'success' : 'failed') }),
    );
    drawResultHearts(this.hearts, result.hearts, result.required, success ? 0xe7a6a6 : 0xd4b488);
    this.hearts.setPosition(
      this.reconciliation.x + this.reconciliation.width + 16,
      this.reconciliation.y + this.reconciliation.height - 24,
    );
    this.goal.setText(
      `${t('resultGoal', { v0: t(result.goalReached ? 'reached' : 'notReached') })} · ${t('difficultyLabel')}: ${t(DIFFICULTY_LABELS[result.difficulty])}`,
    );
    this.quote.setText(t('saraLabel049', { v0: result.closingLine }));
    const textX = this.portrait.render(success ? 'sara-friendly' : 'sara-annoyed') ? 164 : 64;

    placeDialogueText(this.quote, textX, this.hint.x - textX - 4);
    this.goal.setX(textX);
    this.hint.setText(t('spaceNewRound'));
  }

  // eslint-disable-next-line max-lines-per-function -- Der skalare Vertrag teilt dieselben sichtbaren Texte mit der mobilen Karte und dem unveränderlichen Beobachter.
  snapshot() {
    if (!this.result) return null;

    return Object.freeze({
      ...this.result,
      visible: this.root.visible,
      canvasTextVisible: this.root.visible && this.dialogue.visible,
      headlineText: this.headline.text,
      chaosText: this.chaos.text,
      reconciliationText: this.reconciliation.text,
      heartsText: this.heartsText(),
      goalText: this.goal.text,
      summaryText: [
        this.chaos.text,
        this.reconciliation.text,
        this.heartsText(),
        this.goal.text,
      ].join('\n'),
      quoteText: this.quote.text,
      hint: this.hint.text,
      portrait:
        this.result.outcome === 'success' ? ('sara-friendly' as const) : ('sara-annoyed' as const),
    });
  }

  destroy() {
    this.removeCompactListener();
    this.root.destroy(true);
  }

  private heartsText() {
    const result = this.result;

    if (!result) return '';

    return '♥'.repeat(result.hearts) + '♡'.repeat(result.required - result.hearts);
  }
}

function style(size: number) {
  return { fontFamily: 'monospace', fontSize: `${size}px`, color: '#fff1cf', lineSpacing: 6 };
}
