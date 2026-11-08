import type { RoundPhase } from '../game/domain/round-controller.ts';
import type { DamageKind } from '../game/domain/chaos-event.ts';
import type { TextKey } from '../i18n/locale.ts';

/** Presentation time only: no hit stop, camera movement or gameplay timing changes. */
export const FEEDBACK = {
  scoreMs: 900,
  phaseMs: 1400,
  charmMs: 650,
  fadeMs: 150,
  liftPx: 8,
} as const;
export const DAMAGE_FEEDBACK: Record<DamageKind, TextKey> = {
  scratch: 'feedbackScratch',
  tear: 'feedbackTear',
  nibble: 'feedbackNibble',
  tip: 'feedbackTip',
  break: 'feedbackBreak',
  'shelf-damage': 'feedbackShelfDamage',
  collapse: 'feedbackShelfCollapse',
  topple: 'feedbackBooks',
};
export const PHASE_FEEDBACK: Record<RoundPhase | 'success' | 'failed', TextKey> = {
  chaos: 'feedbackStart',
  returning: 'feedbackReturn',
  reaction: 'feedbackReaction',
  reconciliation: 'feedbackCharm',
  success: 'feedbackResultSuccess',
  failed: 'feedbackResultFailed',
};
