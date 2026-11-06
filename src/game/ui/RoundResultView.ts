import { compactVisibility } from './compact-visibility';
import type Phaser from 'phaser';
import type { RoundResult } from '../domain/round-result';

export type ResultViewSnapshot = ReturnType<RoundResultView['snapshot']>;

/** Persistent, keyboard-restartable summary; timing and round state remain in the scene. */
export class RoundResultView {
  private readonly removeCompactListener: () => void;
  private readonly root: Phaser.GameObjects.Container;
  private readonly summary: Phaser.GameObjects.Text;
  private readonly quote: Phaser.GameObjects.Text;
  private readonly hint: Phaser.GameObjects.Text;
  private result: RoundResult | null = null;

  // eslint-disable-next-line max-lines-per-function -- Deklarativer Aufbau der Ergebnisbox mit Titel, Zusammenfassung, Zitat und Neustarthinweis.
  constructor(scene: Phaser.Scene, width: number) {
    this.root = scene.add.container(0, 0).setDepth(16).setVisible(false);
    const panel = scene.add
      .rectangle(width / 2, 235, width - 80, 218, 0x403a35, 1)
      .setStrokeStyle(2, 0xd4b488);
    const title = scene.add.text(60, 140, 'RUNDENERGEBNIS', style(18));

    this.summary = scene.add.text(60, 169, '', style(16));
    this.quote = scene.add.text(60, 288, '', {
      ...style(14),
      fontStyle: 'italic',
      color: '#e4c182',
      wordWrap: { width: width - 120 },
    });
    this.hint = scene.add.text(width - 60, 330, 'R: Neue Runde', style(14)).setOrigin(1, 1);
    const dialogue = scene.add.container(0, 0, [panel, title, this.summary, this.quote, this.hint]);

    this.removeCompactListener = compactVisibility(dialogue);
    this.root.add(dialogue);
  }

  render(result: RoundResult | null) {
    this.result = result;
    this.root.setVisible(result !== null);

    if (!result) return;
    this.summary.setText(summaryText(result));
    this.quote.setText(`Sara: „${result.closingLine}“`);
  }

  // eslint-disable-next-line max-lines-per-function -- Der flache Ergebnisvertrag enthält die skalare Sichtbarkeit beider Darstellungen ohne Engine-Referenzen.
  snapshot() {
    if (!this.result) return null;

    return Object.freeze({
      ...this.result,
      visible: this.root.visible,
      canvasTextVisible: this.root.visible && this.summary.parentContainer.visible,
      summaryText: this.summary.text,
      quoteText: this.quote.text,
      hint: this.hint.text,
    });
  }

  destroy() {
    this.removeCompactListener();
    this.root.destroy(true);
  }
}

function summaryText(result: RoundResult) {
  const outcome = result.outcome === 'success' ? 'Gelungen' : 'Gescheitert';

  return `Chaospunkte: ${result.score}\nSaras Reaktion: ${result.reaction}\nVersöhnung: ${outcome}\nHerzen: ${result.hearts}/${result.required}\nHauptziel: ${result.goalReached ? 'Erreicht' : 'Nicht erreicht'}`;
}

function style(size: number) {
  return { fontFamily: 'monospace', fontSize: `${size}px`, color: '#fff1cf', lineSpacing: 6 };
}
