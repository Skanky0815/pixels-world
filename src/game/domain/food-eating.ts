export const FOOD_EATING_DURATION = 3600;

/** Active presentation time only; the common MainGoal owns success and round state. */
export class FoodEating {
  private elapsedMs = 0;
  private started = false;

  start() {
    if (this.started) return false;
    this.started = true;

    return true;
  }

  advance(deltaMs: number) {
    if (!this.snapshot().active || !Number.isFinite(deltaMs) || deltaMs <= 0) return false;
    this.elapsedMs = Math.min(FOOD_EATING_DURATION, this.elapsedMs + deltaMs);

    return this.elapsedMs === FOOD_EATING_DURATION;
  }

  snapshot() {
    return Object.freeze({
      active: this.started && this.elapsedMs < FOOD_EATING_DURATION,
      elapsedMs: this.elapsedMs,
      phase: phaseAt(this.elapsedMs),
    });
  }
}

function phaseAt(time: number) {
  return time < 400 ? 'approach' : time < 800 ? 'lower' : time < 3200 ? 'eat' : 'settle';
}

/** The muzzle meets the bowl; both the visible feet and body stay on its real support. */
export function foodEatingPlacement(bowlX: number, left: number, right: number) {
  const faceLeft = bowlX - left < 55;
  const anchorX = Math.max(left + 30, Math.min(right - 30, bowlX + (faceLeft ? 25 : -25)));

  return Object.freeze({ anchorX, faceLeft });
}

export function foodEatingPose(time: number, reduced: boolean) {
  const phase = phaseAt(time);

  return Object.freeze({
    frame: frameAt(time, phase, reduced),
    scale: phase === 'lower' || phase === 'eat' ? 2.5 : 2,
    alignment: reduced ? 1 : Math.max(0, Math.min(1, time / 400)),
  });
}

function frameAt(time: number, phase: ReturnType<typeof phaseAt>, reduced: boolean) {
  if (phase === 'approach') return reduced ? 0 : 5 + (Math.floor(time / 100) % 5);

  if (phase === 'lower') return 13;

  if (phase === 'eat') return reduced ? 23 : 23 + (Math.floor(time / 180) % 2);

  return 2;
}
