export const BALL_PLAY_DURATION = 4200;
const PHASES = [
  'look',
  'tap-right',
  'follow-right',
  'tap-left',
  'follow-left',
  'catch',
  'settle',
] as const;

export type BallPlayPhase = (typeof PHASES)[number];

/** One visual celebration after success; the scene supplies active time only. */
export class BallPlay {
  private elapsedMs = 0;
  private started = false;

  start() {
    if (this.started) return false;
    this.started = true;

    return true;
  }

  advance(deltaMs: number) {
    if (!this.snapshot().active || !Number.isFinite(deltaMs) || deltaMs <= 0) return false;
    this.elapsedMs = Math.min(BALL_PLAY_DURATION, this.elapsedMs + deltaMs);

    return this.elapsedMs === BALL_PLAY_DURATION;
  }

  snapshot() {
    return Object.freeze({
      active: this.started && this.elapsedMs < BALL_PLAY_DURATION,
      elapsedMs: this.elapsedMs,
      phase: phaseAt(this.elapsedMs),
    });
  }
}

function phaseAt(time: number): BallPlayPhase {
  const index = [400, 700, 1500, 1800, 2600, 3000].findIndex((end) => time < end);

  return PHASES[index < 0 ? 6 : index];
}

/** Approved mockup profile: roll right, turn, play back left, turn and catch. */
// eslint-disable-next-line max-lines-per-function -- Figur, Ball und Richtungswechsel werden aus derselben aktiven Zeit abgeleitet.
export function ballPlayPose(time: number, reduced: boolean) {
  const phase = phaseAt(time);
  const progress = clamp((time - 700) / 800, 0, 1) - clamp((time - 1800) / 800, 0, 1);
  const paw = !reduced && ['tap-right', 'tap-left', 'catch'].includes(phase);

  return Object.freeze({
    phase,
    frame: frameAt(time, phase, paw, reduced),
    scale: paw ? 2.5 : 2,
    ball: reduced ? 0 : 48 * progress,
    step: reduced ? 0 : 4 * Math.sin(Math.PI * progress),
    faceLeft: reduced || time < 1100 || time >= 2200,
    alignment: reduced ? 0 : clamp(time / 400, 0, 1),
  });
}

function frameAt(time: number, phase: BallPlayPhase, paw: boolean, reduced: boolean) {
  if (paw) return 20 + (Math.floor(time / 125) % 3);

  if (!reduced && following(time, phase)) return 5 + (Math.floor(time / 100) % 5);

  return phase === 'settle' ? 2 : 0;
}

function following(time: number, phase: BallPlayPhase) {
  return (
    (phase === 'follow-right' || phase === 'follow-left') &&
    Math.abs(time - 1100) >= 90 &&
    Math.abs(time - 2200) >= 90
  );
}

/** Keep the ball and Pixel's contact footprint on the successful goal surface. */
export function ballPlayPlacement(ballX: number, left: number, right: number) {
  const direction = right - ballX >= ballX - left ? 1 : -1;
  const space = direction > 0 ? right - 8 - ballX : ballX - left - 8;

  return Object.freeze({
    direction,
    travel: clamp(space, 0, 48),
    anchorX: clamp(ballX + 24 * direction, left + 30, right - 30),
  });
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
