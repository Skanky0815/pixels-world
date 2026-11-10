import { PEACEFUL_GOAL_LINES, type PeacefulGoalLine } from '../../content/peaceful-goal.ts';
import type { RoundSnapshot } from './round-controller.ts';

/** A zero-valued damage event still disqualifies the run; score alone is insufficient. */
export class PeacefulGoal {
  private line: PeacefulGoalLine | null = null;

  // eslint-disable-next-line max-lines-per-function -- Einmaliger Trigger, fachliche Schadensgrenze und Auswahl ohne direkte Wiederholung bilden einen Vertrag.
  start(
    round: RoundSnapshot,
    damagedObjects: number,
    random = Math.random,
    previous?: PeacefulGoalLine,
  ) {
    if (
      this.line ||
      round.endReason !== 'goal' ||
      round.finalChaosScore !== 0 ||
      damagedObjects !== 0
    )
      return false;
    const sample = random();

    validateSample(sample);
    const pool = PEACEFUL_GOAL_LINES.filter((line) => line !== previous);

    this.line = pool[Math.min(pool.length - 1, Math.floor(sample * pool.length))];

    return true;
  }

  snapshot() {
    return Object.freeze({ line: this.line });
  }
}

function validateSample(sample: number) {
  if (!Number.isFinite(sample) || sample < 0 || sample > 1)
    throw new Error('Invalid random sample');
}
