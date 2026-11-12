import type { Difficulty } from '../../content/difficulty';
import { createGoalMarker } from './goal-marker';
import { FAVORITE_BALL_TEXTURE } from '../assets/favorite-ball-art';
import type Phaser from 'phaser';
import type { MainGoal, ResolvedGoal } from '../domain/main-goal';
export class GoalView {
  private readonly root: Phaser.GameObjects.Container;
  private readonly ball: Phaser.GameObjects.Image;
  private readonly marker: Phaser.GameObjects.Container;
  private readonly ballX: number;
  private readonly ballY: number;
  // eslint-disable-next-line max-lines-per-function -- Ball und Zielmarker werden gemeinsam aus derselben validierten Platzierung aufgebaut.
  constructor(
    scene: Phaser.Scene,
    goal: ResolvedGoal,
    private readonly difficulty: Difficulty,
  ) {
    this.root = scene.add.container(0, 0).setDepth(9).setVisible(false);
    this.ball = scene.add.image(goal.x, goal.surfaceY, FAVORITE_BALL_TEXTURE).setOrigin(0.5, 1);
    this.ballX = goal.x;
    this.ballY = goal.surfaceY;
    this.marker = createGoalMarker(scene, goal, difficulty);
    this.root.add([this.marker, this.ball]);
  }

  render(goal: ReturnType<MainGoal['snapshot']>, started: boolean) {
    this.root.setVisible(started);
    this.marker.setVisible(goal.status === 'active' && this.difficulty !== 'hard');
  }

  presentBallPlay(offset: number, angle: number, playing: boolean) {
    this.root.setDepth(playing ? 21 : 9);
    this.ball
      .setOrigin(0.5)
      .setPosition(this.ballX + offset, this.ballY - 8)
      .setRotation(angle);
  }

  // eslint-disable-next-line max-lines-per-function -- Der vollständige unveränderliche Beobachtungsvertrag enthält auch die rein visuelle Ballbewegung.
  snapshot() {
    return Object.freeze({
      visible: this.root.visible,
      ballTexture: this.ball.texture.key,
      ballVisible: this.root.visible && this.ball.visible,
      ballX: this.ball.x,
      ballRotation: this.ball.rotation,
      markerVisible: this.root.visible && this.marker.visible,
      markerWidth: this.marker.getBounds().width,
    });
  }

  destroy() {
    this.root.destroy(true);
  }
}
