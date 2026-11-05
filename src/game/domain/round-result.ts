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

  return Object.freeze({
    score: round.finalChaosScore,
    reaction: angerFor(home.selection.score).label,
    dialogue: home.selection.dialogue,
    outcome: charm.stage === 'complete' ? ('success' as const) : ('failed' as const),
    hearts: charm.successes,
    required: charm.required,
  });
}
