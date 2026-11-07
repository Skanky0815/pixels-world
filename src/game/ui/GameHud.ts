import { DIFFICULTY_LABELS } from '../../content/difficulty';
import { t } from '../../i18n/locale.ts';
import { compactVisibility } from './compact-visibility';
import type Phaser from 'phaser';
import type { HudState } from './hud-state';
const SCORE_STYLE = { fontFamily: 'monospace', fontSize: '12px', color: '#584637' };

/** A scene-owned score view; no input, physics or gameplay model references. */
export class GameHud {
  private readonly removeCompactListener: () => void;
  private readonly scoreText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.scoreText = scene.add.text(26, 25, '', SCORE_STYLE).setScrollFactor(0).setDepth(10);
    this.removeCompactListener = compactVisibility(this.scoreText);
  }

  render(state: HudState) {
    this.scoreText.setText(
      `${t('chaosPoints', { v0: state.score })} · ${t(DIFFICULTY_LABELS[state.difficulty])}`,
    );
  }

  snapshot() {
    return { scoreText: this.scoreText.text };
  }

  destroy() {
    this.removeCompactListener();
    this.scoreText.destroy();
  }
}
