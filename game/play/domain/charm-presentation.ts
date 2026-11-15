import { CharmMotion, type CharmAction } from './charm-motion.ts';
import type { ReconciliationSnapshot } from './reconciliation.ts';

/** Reacts to actual accepted game transitions; never advances the minigame itself. */
export class CharmPresentation {
  readonly motion = new CharmMotion();

  update(before: ReconciliationSnapshot, after: ReconciliationSnapshot, elapsed: number) {
    if (after.stage === 'waiting') {
      this.motion.reset();

      return;
    }

    this.motion.advance(elapsed);
    const action = feedbackAction(before, after);

    if (action) this.motion.trigger(action);
    else if (after.failures > before.failures || continued(before, after)) this.motion.release();
  }

  snapshot() {
    return this.motion.snapshot();
  }
}

function feedbackAction(
  before: ReconciliationSnapshot,
  after: ReconciliationSnapshot,
): CharmAction | null {
  if (after.stage === 'finale' && before.stage !== 'finale') return 'roll';

  if (after.successes > before.successes) return after.successes % 2 === 1 ? 'rub' : 'headbutt';

  return after.step > before.step ? (after.step % 2 === 0 ? 'paw' : 'purr') : null;
}

function continued(before: ReconciliationSnapshot, after: ReconciliationSnapshot) {
  return before.stage === 'feedback' && after.stage === 'cue';
}
