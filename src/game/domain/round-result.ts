import { ROUND_ENDINGS } from '../../content/round-endings.ts';
import { angerFor } from './chaos.ts';
import type { RoundSnapshot } from './round-controller.ts';
import type { HomecomingSnapshot } from './homecoming.ts';
import type { ReconciliationSnapshot } from './reconciliation.ts';

export type RoundResult = NonNullable<ReturnType<typeof roundResult>>;

/** Final presentation data only; never awards points or changes any gameplay state. */
// eslint-disable-next-line max-lines-per-function -- Die finale Auswahl wird atomar aus den drei unveränderlichen Phasensnapshots aufgebaut.
export function roundResult(
  round: RoundSnapshot,
  home: HomecomingSnapshot,
  charm: ReconciliationSnapshot,
) {
  if (round.finalChaosScore === null || home.stage !== 'complete' || !home.selection) return null;

  if (charm.stage !== 'complete' && charm.stage !== 'failed') return null;

  const anger = angerFor(home.selection.score);
  const outcome = charm.stage === 'complete' ? 'success' : 'failed';

  return Object.freeze({
    score: round.finalChaosScore,
    difficulty: charm.difficulty,
    goalReached: round.endReason === 'goal',
    reaction: anger.label,
    closingLine: ROUND_ENDINGS[anger.id][outcome],
    dialogue: home.selection.dialogue,
    outcome,
    hearts: charm.successes,
    required: charm.required,
  });
}
