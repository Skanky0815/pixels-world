import type Phaser from 'phaser';
import type { HudState } from './hud-state';

const ROUND_STATUS = {
  time: 'Noch etwas Zeit',
  soon: 'Sara könnte bald kommen',
  imminent: 'Jeden Moment …',
  home: 'Sara ist zu Hause! · R: Neue Runde',
} as const;

const STATUS: Record<HudState['activity'], string> = {
  idle: 'PIXEL · HOME ALONE',
  climbing: 'PIXEL · CURTAIN CLIMBING',
  sliding: 'PIXEL · VORHANG RUTSCHEN',
  scratching: 'PIXEL · SOFA KRATZEN',
  nibbling: 'PIXEL · KATZENGRAS KNABBERN',
  wobbling: 'PIXEL · VORSICHT, DER TOPF WACKELT!',
};

const HOME_STATUS = {
  returning: 'Sara kommt herein … · R: Neue Runde',
  reaction: 'Sara schaut sich um … · R: Neue Runde',
  reconciliation: 'Versöhnung · Pfeiltasten laut Anzeige · R: Neue Runde',
};

/** A scene-owned view; no input, physics, scoring or gameplay model references. */
export class GameHud {
  private readonly root: Phaser.GameObjects.Container;
  private readonly status: Phaser.GameObjects.Text;
  private readonly scoreText: Phaser.GameObjects.Text;
  private readonly climbHint: Phaser.GameObjects.Text;
  private readonly roundText: Phaser.GameObjects.Text;
  private readonly angerBar: Phaser.GameObjects.Graphics;
  private ratio = NaN;
  private color = NaN;

  // eslint-disable-next-line max-lines-per-function -- Die deklarative HUD-Hierarchie mit Positionen und Textstilen bleibt gemeinsam sichtbar.
  constructor(
    scene: Phaser.Scene,
    layout: { readonly climbHint: { readonly x: number; readonly y: number } },
  ) {
    this.root = scene.add.container(0, 0).setScrollFactor(0).setDepth(10);
    const textStyle = { fontFamily: 'monospace', fontSize: '12px', color: '#584637' };

    this.climbHint = scene.add
      .text(layout.climbHint.x, layout.climbHint.y, '↑ KLETTERN\nLOSLASSEN: RUTSCHEN', {
        ...textStyle,
        color: '#fff1cf',
        backgroundColor: '#615047',
      })
      .setPadding(7, 5)
      .setOrigin(0.5);
    this.status = scene.add.text(26, 25, STATUS.idle, textStyle);
    this.scoreText = scene.add.text(26, 48, '', textStyle);
    this.roundText = scene.add.text(26, 88, '', textStyle);
    this.angerBar = scene.add.graphics();
    this.root.add([this.climbHint, this.status, this.scoreText, this.angerBar, this.roundText]);
  }

  render(state: HudState) {
    this.renderRound(state);
    this.scoreText.setText(scoreCaption(state));
    this.climbHint.setAlpha(state.nearCurtain ? 1 : 0.65);
    this.climbHint.setVisible(state.round.phase === 'chaos');
    this.renderAnger(state);
  }

  showResult(outcome: 'success' | 'failed') {
    this.roundText.setText('Runde beendet · R: Neue Runde');
    this.status.setText(
      outcome === 'success' ? 'PIXEL · VERSÖHNT' : 'PIXEL · VERSÖHNUNG GESCHEITERT',
    );
  }

  private renderRound(state: HudState) {
    this.status.setText(
      state.round.phase === 'chaos' ? STATUS[state.activity] : 'PIXEL · SARA IST DA',
    );
    this.roundText.setText(state.round.paused ? 'Pause · Runde angehalten' : roundStatus(state));
  }

  private renderAnger(state: HudState) {
    const ratio = Math.max(0, Math.min(state.angerRatio, 1));

    if (ratio !== this.ratio || state.anger.color !== this.color) {
      this.ratio = ratio;
      this.color = state.anger.color;
      this.angerBar.clear().fillStyle(0x705547, 0.25).fillRect(26, 70, 160, 6);
      this.angerBar.fillStyle(this.color).fillRect(26, 70, 160 * ratio, 6);
    }
  }

  /** Detached scalar observation, also used by the read-only E2E observer. */
  // eslint-disable-next-line max-lines-per-function -- Der flache nur lesbare HUD-Vertrag bleibt vollständig ausgeschrieben.
  snapshot() {
    return {
      roundText: this.roundText.text,
      statusText: this.status.text,
      scoreText: this.scoreText.text,
      climbHintText: this.climbHint.text,
      climbHintAlpha: this.climbHint.alpha,
      angerRatio: this.ratio,
      angerColor: this.color,
      elements: this.root.length,
    };
  }

  destroy() {
    this.root.destroy(true);
  }
}

function roundStatus(state: HudState) {
  return state.round.phase === 'chaos'
    ? ROUND_STATUS[state.round.hint]
    : HOME_STATUS[state.round.phase];
}

function scoreCaption(state: HudState) {
  const label = state.round.phase === 'chaos' ? 'SARAS ÄRGER (VORSCHAU)' : 'SARAS ÄRGER';

  return `CHAOS: ${state.score}  ·  ${label}: ${state.anger.label}`;
}
