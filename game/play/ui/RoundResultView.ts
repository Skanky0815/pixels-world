import { t } from '../../shared/i18n/locale.ts';
import { dialogueFrame, dialogueTextStyle as style } from './dialogue-frame';
import type { DialoguePlacement } from '../content/dialogue-layout';
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
  private readonly discoveries: Phaser.GameObjects.Text;
  private newDiscoveries = 0;
  private readonly left: number;
  private readonly right: number;
  private readonly quote: Phaser.GameObjects.Text;
  private readonly hint: Phaser.GameObjects.Text;
  private result: RoundResult | null = null;
  private readonly portrait: DialoguePortrait;
  // eslint-disable-next-line max-lines-per-function -- Titel, hervorgehobener Ausgang und zwei Ergebnisspalten bilden eine gemeinsame deklarative Karte.
  constructor(scene: Phaser.Scene, width: number, placement: DialoguePlacement) {
    this.root = scene.add.container(0, 0).setDepth(16).setVisible(false);
    const { left, width: panelWidth, right, panel } = dialogueFrame(scene, width, placement, true);

    this.left = left;
    this.right = right;
    this.title = scene.add.text(left + panelWidth / 2, 122, '', style(12)).setOrigin(0.5, 0);
    this.headline = scene.add.text(left + panelWidth / 2, 150, '', style(28)).setOrigin(0.5, 0);
    this.chaos = scene.add.text(left + 20, 215, '', {
      ...style(16),
      wordWrap: { width: panelWidth / 2 - 40 },
    });
    this.reconciliation = scene.add.text(left + panelWidth / 2, 215, '', {
      ...style(16),
      wordWrap: { width: panelWidth / 2 - 20 },
    });
    this.hearts = scene.add.graphics().setScale(1.75);
    this.discoveries = scene.add.text(left + 20, 300, '', { ...style(14), color: '#c8dfa0' });
    this.quote = scene.add.text(left + 20, 344, '', {
      ...style(14),
      fontStyle: 'italic',
      color: '#e4c182',
      wordWrap: { width: panelWidth - 40 },
    });
    this.hint = scene.add.text(right - 20, 400, '', style(13)).setOrigin(1, 1);
    this.portrait = new DialoguePortrait(scene, left + 60, 366);
    this.dialogue = scene.add.container(0, 0, [
      panel,
      this.portrait.image,
      this.title,
      this.headline,
      this.chaos,
      this.reconciliation,
      this.hearts,
      this.discoveries,
      this.quote,
      this.hint,
    ]);
    this.removeCompactListener = compactVisibility(this.dialogue);
    this.root.add(this.dialogue);
  }

  render(result: RoundResult | null, newDiscoveries = 0) {
    this.result = result;
    this.newDiscoveries = newDiscoveries;
    this.root.setVisible(result !== null);

    if (result) this.renderText(result);
  }

  // eslint-disable-next-line max-lines-per-function -- Beide Spalten und der Ausgang werden atomar in derselben Sprache aktualisiert.
  private renderText(result: RoundResult) {
    const success = result.outcome === 'success';

    this.title.setText(t('roundResult'));
    this.renderDiscoveries(result);
    this.headline.setText(resultHeadline(result));
    this.headline.setColor(success ? '#c8dfa0' : '#efb69d');
    this.chaos.setText(t('resultChaosDetails', { v0: result.score, v1: result.reaction }));
    this.reconciliation.setText(
      result.peaceful
        ? t('peacefulResultStatus')
        : t('resultReconciliation', { v0: t(success ? 'success' : 'failed') }),
    );
    drawResultHearts(this.hearts, result.hearts, result.required, success ? 0xe7a6a6 : 0xd4b488);
    this.hearts.setPosition(
      this.reconciliation.x,
      this.reconciliation.y + this.reconciliation.height + 8,
    );
    this.quote.setText(t('saraLabel049', { v0: result.closingLine }));
    const textX = this.portrait.render(success ? 'sara-friendly' : 'sara-annoyed')
      ? this.left + 120
      : this.left + 20;

    placeDialogueText(this.quote, textX, this.hint.x - textX - 4);
    this.hint.setText(t(success ? 'spaceResultLevels' : 'spaceResultRetry'));
  }

  private renderDiscoveries(result: RoundResult) {
    const failed = result.outcome === 'failed';
    const caption = failed
      ? t('resultAlbumNotSaved')
      : t('resultAlbumDiscoveries', { count: this.newDiscoveries });

    this.discoveries.setText(caption).setColor(failed ? '#d4b488' : '#c8dfa0');
  }

  // eslint-disable-next-line max-lines-per-function -- Der skalare Vertrag teilt dieselben sichtbaren Texte mit der mobilen Karte und dem unveränderlichen Beobachter.
  snapshot() {
    if (!this.result) return null;

    return Object.freeze({
      ...this.result,
      visible: this.root.visible,
      canvasTextVisible: this.root.visible && this.dialogue.visible,
      dialogueBounds: Object.freeze({ left: this.left, right: this.right }),
      headlineText: this.headline.text,
      chaosText: this.chaos.text,
      reconciliationText: this.reconciliation.text,
      heartsText: this.heartsText(),
      newDiscoveries: this.newDiscoveries,
      albumText: this.discoveries.text,
      summaryText: [
        this.chaos.text,
        this.reconciliation.text,
        this.heartsText(),
        this.discoveries.text,
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

    if (!result || result.peaceful) return '';

    return '♥'.repeat(result.hearts) + '♡'.repeat(result.required - result.hearts);
  }
}

function resultHeadline(result: RoundResult) {
  if (result.peaceful) return t('peacefulResultTitle');

  return t(result.outcome === 'success' ? 'resultFriendsAgain' : 'resultStillInTrouble');
}
