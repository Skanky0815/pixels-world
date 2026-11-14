import type { Difficulty } from '../../content/difficulty';
import { createGoalMarker } from './goal-marker';
import { FOOD_BOWL_TEXTURE } from '../assets/food-bowl-art';
import { FAVORITE_BALL_TEXTURE } from '../assets/favorite-ball-art';
import type Phaser from 'phaser';
import type { MainGoal, ResolvedGoal } from '../domain/main-goal';
export class GoalView {
  private readonly root: Phaser.GameObjects.Container;
  private readonly image: Phaser.GameObjects.Image;
  private readonly marker: Phaser.GameObjects.Container;
  private readonly baseX: number;
  private readonly baseY: number;
  // eslint-disable-next-line max-lines-per-function -- Zielbild und Zielmarker werden gemeinsam aus derselben validierten Platzierung aufgebaut.
  constructor(
    scene: Phaser.Scene,
    private readonly goal: ResolvedGoal,
    private readonly difficulty: Difficulty,
  ) {
    this.root = scene.add.container(0, 0).setDepth(9).setVisible(false);
    const texture = goal.kind === 'food' ? FOOD_BOWL_TEXTURE : FAVORITE_BALL_TEXTURE;

    this.image = scene.add.image(goal.x, goal.surfaceY, texture).setOrigin(0.5, 1);
    this.baseX = goal.x;
    this.baseY = goal.surfaceY;
    this.marker = createGoalMarker(scene, goal, difficulty);
    this.root.add([this.marker, this.image]);
  }

  render(goal: ReturnType<MainGoal['snapshot']>, started: boolean) {
    this.root.setVisible(started);
    this.marker.setVisible(goal.status === 'active' && this.difficulty !== 'hard');
  }

  presentEating(eating: boolean) {
    this.root.setDepth(eating ? 21 : 9);
  }

  presentBallPlay(offset: number, angle: number, playing: boolean) {
    this.root.setDepth(playing ? 21 : 9);
    this.image
      .setOrigin(0.5)
      .setPosition(this.baseX + offset, this.baseY - 8)
      .setRotation(angle);
  }

  // eslint-disable-next-line max-lines-per-function -- Der vollständige unveränderliche Beobachtungsvertrag enthält auch die rein visuelle Ballbewegung.
  snapshot() {
    return Object.freeze({
      visible: this.root.visible,
      kind: this.goal.kind,
      texture: this.image.texture.key,
      ballTexture: this.image.texture.key,
      ballVisible: this.root.visible && this.image.visible,
      ballX: this.image.x,
      ballRotation: this.image.rotation,
      markerVisible: this.root.visible && this.marker.visible,
      markerWidth: this.marker.getBounds().width,
    });
  }

  destroy() {
    this.root.destroy(true);
  }
}
