import type Phaser from 'phaser';
import type { HudState } from './hud-state';

const STATUS: Record<HudState['activity'], string> = {
  idle: 'PIXEL · HOME ALONE',
  climbing: 'PIXEL · CURTAIN CLIMBING',
  sliding: 'PIXEL · VORHANG RUTSCHEN',
  scratching: 'PIXEL · SOFA KRATZEN',
  nibbling: 'PIXEL · KATZENGRAS KNABBERN',
  wobbling: 'PIXEL · VORSICHT, DER TOPF WACKELT!',
};

/** A scene-owned view; no input, physics, scoring or gameplay model references. */
export class GameHud {
  private readonly root: Phaser.GameObjects.Container;
  private readonly status: Phaser.GameObjects.Text;
  private readonly scoreText: Phaser.GameObjects.Text;
  private readonly climbHint: Phaser.GameObjects.Text;
  private readonly angerBar: Phaser.GameObjects.Graphics;
  private ratio = NaN;
  private color = NaN;

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
    this.angerBar = scene.add.graphics();
    this.root.add([this.climbHint, this.status, this.scoreText, this.angerBar]);
  }

  render(state: HudState) {
    this.status.setText(STATUS[state.activity]);
    this.scoreText.setText(
      `CHAOS: ${state.score}  ·  SARAS ÄRGER (VORSCHAU): ${state.anger.label}`,
    );
    this.climbHint.setAlpha(state.nearCurtain ? 1 : 0.65);
    const ratio = Math.max(0, Math.min(state.angerRatio, 1));

    if (ratio !== this.ratio || state.anger.color !== this.color) {
      this.ratio = ratio;
      this.color = state.anger.color;
      this.angerBar.clear().fillStyle(0x705547, 0.25).fillRect(26, 70, 160, 6);
      this.angerBar.fillStyle(this.color).fillRect(26, 70, 160 * ratio, 6);
    }
  }

  /** Detached scalar observation, also used by the read-only E2E observer. */
  snapshot() {
    return {
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
