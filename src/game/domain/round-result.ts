import { ROUND_ENDINGS } from '../../content/round-endings.ts';
import { angerFor } from './chaos.ts';
import type { RoundSnapshot } from './round-controller.ts';
import type { HomecomingSnapshot } from './homecoming.ts';
import type { ReconciliationSnapshot } from './reconciliation.ts';
import { copy } from '../../i18n/locale.ts';
import type { Difficulty } from '../../content/difficulty.ts';

export type RoundResult = NonNullable<ReturnType<typeof roundResult>>;

/** Final presentation data only; never awards points or changes any gameplay state. */
// eslint-disable-next-line max-lines-per-function -- Die finale Auswahl wird atomar aus den drei unveränderlichen Phasensnapshots aufgebaut.
export function roundResult(
  round: RoundSnapshot,
  home: HomecomingSnapshot,
  charm: ReconciliationSnapshot,
  difficulty: Difficulty = 'normal',
) {
  if (round.finalChaosScore === null || home.stage !== 'complete' || !home.selection) return null;

  const anger = angerFor(home.selection.score);
  const base = {
    score: round.finalChaosScore,
    goalReached: round.endReason === 'goal',
    reaction: anger.label,
    dialogue: home.selection.dialogue,
  };

  if (home.selection.peaceful && base.goalReached)
    return Object.freeze({
      ...base,
      difficulty,
      closingLine: copy('peacefulClosing'),
      outcome: 'success' as const,
      hearts: 0,
      required: 0,
      peaceful: true as const,
    });
  const outcome = charmOutcome(charm);

  if (!outcome) return null;

  return Object.freeze({
    ...base,
    difficulty: charm.difficulty,
    closingLine: ROUND_ENDINGS[anger.id][outcome],
    outcome,
    hearts: charm.successes,
    required: charm.required,
    peaceful: false as const,
  });
}

function charmOutcome(charm: ReconciliationSnapshot) {
  if (charm.stage === 'complete') return 'success' as const;

  return charm.stage === 'failed' ? ('failed' as const) : null;
}
