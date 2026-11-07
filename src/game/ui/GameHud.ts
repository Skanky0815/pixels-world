import { t, translateExact } from '../../i18n/locale.ts';
import { compactVisibility } from './compact-visibility';
import type Phaser from 'phaser';
import type { HudState } from './hud-state';
/** A scene-owned view; no input, physics, scoring or gameplay model references. */
export class GameHud {
  private readonly removeCompactListener: () => void;
  private readonly root: Phaser.GameObjects.Container;
  private readonly scoreText: Phaser.GameObjects.Text;
  private readonly climbHint: Phaser.GameObjects.Text;
  // eslint-disable-next-line max-lines-per-function -- Die deklarative HUD-Hierarchie mit Positionen und Textstilen bleibt gemeinsam sichtbar.
  constructor(
    scene: Phaser.Scene,
    layout: {
      readonly climbHint: {
        readonly x: number;
        readonly y: number;
      };
    },
  ) {
    this.root = scene.add.container(0, 0).setScrollFactor(0).setDepth(10);
    const textStyle = { fontFamily: 'monospace', fontSize: '12px', color: '#584637' };

    this.climbHint = scene.add
      .text(layout.climbHint.x, layout.climbHint.y, t('climbLetGoSlide'), {
        ...textStyle,
        color: '#fff1cf',
        backgroundColor: '#615047',
      })
      .setPadding(7, 5)
      .setOrigin(0.5);
    this.scoreText = scene.add.text(26, 25, '', textStyle);
    this.root.add([this.climbHint, this.scoreText]);
    this.removeCompactListener = compactVisibility(this.root);
  }

  render(state: HudState) {
    this.climbHint.setText(translateExact(t('climbLetGoSlide')));
    this.scoreText.setText(t('chaosPoints', { v0: state.score }));
    this.climbHint.setAlpha(state.nearCurtain ? 1 : 0.65);
    this.climbHint.setVisible(state.round.phase === 'chaos');
  }

  /** Detached scalar observation, also used by the read-only E2E observer. */
  snapshot() {
    return {
      scoreText: this.scoreText.text,
      climbHintText: this.climbHint.text,
      climbHintAlpha: this.climbHint.alpha,
      elements: this.root.length,
    };
  }

  destroy() {
    this.removeCompactListener();
    this.root.destroy(true);
  }
}
