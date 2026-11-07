import type Phaser from 'phaser';
import type { Difficulty } from '../../content/difficulty';
import type { ResolvedGoal } from '../domain/main-goal';

const STYLES = {
  easy: { radius: 18, alpha: 0.6, fontSize: '26px', color: '#fff1cf', strokeThickness: 2 },
  normal: { radius: 11, alpha: 0.35, fontSize: '18px', color: '#584637', strokeThickness: 0 },
} as const;

// eslint-disable-next-line max-lines-per-function -- Halo und Stern bilden einen gemeinsamen Hinweis; Schwer erzeugt nur den leeren Container ohne sichtbare Markerobjekte.
export function createGoalMarker(scene: Phaser.Scene, goal: ResolvedGoal, difficulty: Difficulty) {
  const marker = scene.add.container(goal.x, goal.surfaceY - 10);

  if (difficulty === 'hard') return marker;
  const style = STYLES[difficulty];

  marker.add([
    scene.add.circle(0, 0, style.radius, 0xffe0a0, style.alpha),
    scene.add
      .text(0, -28, '★', {
        fontSize: style.fontSize,
        color: style.color,
        stroke: '#584637',
        strokeThickness: style.strokeThickness,
      })
      .setOrigin(0.5),
  ]);

  return marker;
}
