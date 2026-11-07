import type { Difficulty } from '../../content/difficulty';
import { createGoalMarker } from './goal-marker';
import { FAVORITE_BALL_TEXTURE } from '../assets/favorite-ball-art';
import { t, translateExact } from '../../i18n/locale.ts';
import { compactVisibility } from './compact-visibility';
import type Phaser from 'phaser';
import type { MainGoal, ResolvedGoal } from '../domain/main-goal';
export class GoalView {
  private readonly removeCompactListener: () => void;
  private readonly root: Phaser.GameObjects.Container;
  private readonly caption: Phaser.GameObjects.Text;
  private readonly ball: Phaser.GameObjects.Image;
  private readonly marker: Phaser.GameObjects.Container;
  // eslint-disable-next-line max-lines-per-function -- Zielmarker und kurzer Hinweis werden gemeinsam aus derselben validierten Platzierung aufgebaut.
  constructor(
    scene: Phaser.Scene,
    goal: ResolvedGoal,
    private readonly difficulty: Difficulty,
  ) {
    this.root = scene.add.container(0, 0).setDepth(9).setVisible(false);
    this.caption = scene.add.text(26, 48, '', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#fff1cf',
      backgroundColor: '#403a35',
      padding: { x: 6, y: 3 },
      wordWrap: { width: 670 },
    });
    this.ball = scene.add.image(goal.x, goal.surfaceY, FAVORITE_BALL_TEXTURE).setOrigin(0.5, 1);
    this.marker = createGoalMarker(scene, goal, difficulty);
    this.root.add([this.caption, this.marker, this.ball]);
    this.removeCompactListener = compactVisibility(this.caption);
  }

  render(goal: ReturnType<MainGoal['snapshot']>, started: boolean) {
    this.root.setVisible(started);
    this.marker.setVisible(goal.status === 'active' && this.difficulty !== 'hard');
    this.caption.setText(translateExact(goalCaption(goal)));
  }

  snapshot() {
    return Object.freeze({
      text: this.caption.text,
      visible: this.root.visible,
      ballTexture: this.ball.texture.key,
      ballVisible: this.root.visible && this.ball.visible,
      markerVisible: this.root.visible && this.marker.visible,
      markerWidth: this.marker.getBounds().width,
    });
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
