import { CharmMotion } from './charm-motion.ts';

export const GOAL_REST_DURATION = 2800;

/** A short, pausable rest after the shared main goal has already been reached. */
export class GoalRest {
  private elapsedMs = 0;
  private started = false;
  private readonly motion = new CharmMotion();

  start() {
    this.started = true;
    this.motion.trigger('roll');
    this.motion.advance(700);
  }

  advance(delta: number) {
    if (!this.started || !Number.isFinite(delta) || delta <= 0) return false;
    this.motion.advance(delta);

    if (!this.snapshot().active) return false;
    this.elapsedMs = Math.min(GOAL_REST_DURATION, this.elapsedMs + delta);

    return this.elapsedMs === GOAL_REST_DURATION;
  }

  pose(reduced = false) {
    return { ...this.motion.pose(reduced), x: 0, faceLeft: false };
  }

  snapshot() {
    return Object.freeze({
      active: this.started && this.elapsedMs < GOAL_REST_DURATION,
      elapsedMs: this.elapsedMs,
    });
  }
}
