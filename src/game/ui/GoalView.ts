import { t, translateExact } from '../../i18n/locale.ts';
import { compactVisibility } from './compact-visibility';
import type Phaser from 'phaser';
import type { MainGoal, ResolvedGoal } from '../domain/main-goal';
export class GoalView {
  private readonly removeCompactListener: () => void;
  private readonly root: Phaser.GameObjects.Container;
  private readonly caption: Phaser.GameObjects.Text;
  private readonly marker: Phaser.GameObjects.Container;
  // eslint-disable-next-line max-lines-per-function -- Zielmarker und kurzer Hinweis werden gemeinsam aus derselben validierten Platzierung aufgebaut.
  constructor(scene: Phaser.Scene, goal: ResolvedGoal) {
    this.root = scene.add.container(0, 0).setDepth(9).setVisible(false);
    this.caption = scene.add.text(26, 108, '', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#fff1cf',
      backgroundColor: '#403a35',
      padding: { x: 6, y: 3 },
      wordWrap: { width: 670 },
    });
    this.marker = scene.add.container(goal.x, goal.surfaceY - 10);
    this.marker.add([
      scene.add.circle(0, 0, 11, 0xffe0a0, 0.35),
      scene.add.circle(0, 1, 7, 0xe8ac74).setStrokeStyle(2, 0x705547),
      scene.add.text(0, -28, '★', { fontSize: '18px', color: '#584637' }).setOrigin(0.5),
    ]);
    this.root.add([this.caption, this.marker]);
    this.removeCompactListener = compactVisibility(this.caption);
  }

  render(goal: ReturnType<MainGoal['snapshot']>, started: boolean) {
    this.root.setVisible(started);
    this.marker.setVisible(goal.status === 'active');
    this.caption.setText(translateExact(goalCaption(goal)));
  }

  snapshot() {
    return Object.freeze({ text: this.caption.text, visible: this.root.visible });
  }

  destroy() {
    this.removeCompactListener();
    this.root.destroy(true);
  }
}

function goalCaption(goal: ReturnType<MainGoal['snapshot']>) {
  if (goal.status === 'reached') return t('goalReachedSaraIsComingHome', { v0: goal.label });

  if (goal.status === 'missed') return t('goalMissedSaraIsBack', { v0: goal.label });

  if (goal.progress > 0)
    return t('pixelIsPlayingWithThe', { v0: goal.label, v1: Math.round(goal.progress * 100) });

  return goal.motivation;
}
