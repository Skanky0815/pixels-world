import type { Difficulty } from '../../content/difficulty';
/** Display data only; scoring remains in the scene. */
export interface HudState {
  readonly score: number;
  readonly difficulty: Difficulty;
}
