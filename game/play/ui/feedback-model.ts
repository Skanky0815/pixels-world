import {
  FEEDBACK,
  DAMAGE_FEEDBACK,
  OBJECT_DAMAGE_FEEDBACK,
  PHASE_FEEDBACK,
} from '../content/feedback.ts';
import type { TextKey } from '../../shared/i18n/locale.ts';
import type { ChaosEvent } from '../domain/chaos-event.ts';
import type { ReconciliationSnapshot } from '../domain/reconciliation.ts';
import type { RoundSnapshot } from '../domain/round-controller.ts';

export type FeedbackChannel = 'score' | 'phase' | 'charm';
export interface FeedbackState {
  readonly started: boolean;
  readonly round: RoundSnapshot;
  readonly charm: ReconciliationSnapshot;
  readonly outcome: 'success' | 'failed' | null;
  readonly peaceful?: boolean;
  readonly goalKind?: 'food' | 'toy' | 'rest';
  readonly goalAction?: 'food' | 'toy' | 'rest';
}
export interface FeedbackMessage {
  readonly id: number;
  readonly key: TextKey;
  readonly value: number;
  readonly tone: 'positive' | 'negative' | 'phase';
  readonly durationMs: number;
  readonly elapsedMs: number;
  readonly count: number;
}

/** Read-only presentation observer: it cannot mutate models, score, input or time limits. */
export class FeedbackModel {
  private readonly seen = new Set<string>();
  private readonly messages = new Map<FeedbackChannel, FeedbackMessage>();
  private scores: readonly FeedbackMessage[] = [];
  private sequence = 0;
  private phase = 'intro';
  private charm: ReconciliationSnapshot | undefined;

  damage(event: ChaosEvent, objectKind?: string) {
    if (this.seen.has(event.id)) return;
    this.seen.add(event.id);
    const key =
      OBJECT_DAMAGE_FEEDBACK[objectKind ?? '']?.[event.kind] ?? DAMAGE_FEEDBACK[event.kind];

    const message = this.show('score', key, 'positive', FEEDBACK.scoreMs, event.value);

    this.scores = damageGroups(this.scores, message);
  }

  advance(delta: number, state: FeedbackState) {
    for (const [channel, message] of this.messages) this.age(channel, message, delta);
    this.scores = this.scores.flatMap((message) => {
      const elapsedMs = message.elapsedMs + activeDelta(delta);

      return elapsedMs >= message.durationMs ? [] : [Object.freeze({ ...message, elapsedMs })];
    });
    this.observePhase(state);
    this.observeCharm(state.charm);
  }

  private age(channel: FeedbackChannel, message: FeedbackMessage, delta: number) {
    const elapsedMs = message.elapsedMs + activeDelta(delta);

    if (elapsedMs >= message.durationMs) this.messages.delete(channel);
    else this.messages.set(channel, Object.freeze({ ...message, elapsedMs }));
  }

  // eslint-disable-next-line max-lines-per-function -- Eine neue Phase wählt genau eine Meldung mit passender Zielart.
  private observePhase(state: FeedbackState) {
    const phase = state.started ? feedbackPhase(state) : 'intro';
    const tone = phaseTone(phase);

    if (phase === this.phase) return;
    this.phase = phase;

    if (phase === 'intro') return;
    const key =
      phase === 'peaceful' && state.goalKind === 'rest'
        ? 'feedbackRestResult'
        : PHASE_FEEDBACK[phase];

    this.show('phase', key, tone, FEEDBACK.phaseMs);
  }

  private observeCharm(current: ReconciliationSnapshot) {
    const previous = this.charm;
    const key = previous && charmFeedback(previous, current);
    const tone = current.failures > (previous?.failures ?? 0) ? 'negative' : 'positive';

    this.charm = current;

    if (key) this.show('charm', key, tone, FEEDBACK.charmMs);
  }

  // eslint-disable-next-line max-lines-per-function -- Signatur und flacher unveränderlicher Darstellungsvertrag bleiben gemeinsam sichtbar.
  private show(
    channel: FeedbackChannel,
    key: TextKey,
    tone: FeedbackMessage['tone'],
    durationMs: number,
    value = 0,
  ) {
    const message = Object.freeze({
      id: ++this.sequence,
      key,
      value,
      tone,
      durationMs,
      elapsedMs: 0,
      count: 1,
    });

    this.messages.set(channel, message);

    return message;
  }

  snapshot() {
    return Object.freeze({
      sequence: this.sequence,
      scores: Object.freeze([...this.scores]),
      messages: Object.freeze(Object.fromEntries(this.messages)) as Readonly<
        Partial<Record<FeedbackChannel, FeedbackMessage>>
      >,
    });
  }
}

function phaseTone(phase: string) {
  if (phase === 'failed') return 'negative';

  return ['success', 'peaceful'].includes(phase) ? 'positive' : 'phase';
}

function feedbackPhase(state: FeedbackState) {
  if (state.goalAction)
    return state.goalAction === 'rest'
      ? 'resting'
      : state.goalAction === 'food'
        ? 'eating'
        : 'playing';

  if (state.peaceful && state.outcome) return 'peaceful';

  return state.outcome ?? state.round.phase;
}

function charmFeedback(
  previous: ReconciliationSnapshot,
  current: ReconciliationSnapshot,
): TextKey | undefined {
  if (current.successes > previous.successes) return 'feedbackHeart';

  if (current.failures > previous.failures)
    return current.feedback === 'timeout' ? 'feedbackTimeout' : 'feedbackWrong';

  return current.step > previous.step ? 'feedbackCorrect' : undefined;
}

function activeDelta(delta: number) {
  return Number.isFinite(delta) ? Math.max(0, delta) : 0;
}

/** Keep recent wording while bounding rapid chains without dropping their damage counts. */
function damageGroups(groups: readonly FeedbackMessage[], message: FeedbackMessage) {
  const previous = groups.find((group) => group.key === message.key);
  const remaining = groups.filter((group) => group !== previous);
  const next = previous ? mergeDamage(previous, message, message.key) : message;

  if (remaining.length >= FEEDBACK.scoreGroups)
    remaining.splice(0, 2, mergeDamage(remaining[0], remaining[1]));

  return [...remaining, next];
}

// eslint-disable-next-line max-lines-per-function -- Ein unveränderlicher Gruppenwert erhält Zählung, Punktwert und verbleibende Präsentationszeit gemeinsam.
export function mergeDamage(
  first: FeedbackMessage,
  second: FeedbackMessage,
  key: TextKey = 'feedbackDamageCombo',
): FeedbackMessage {
  return Object.freeze({
    ...second,
    key,
    value: first.value + second.value,
    count: first.count + second.count,
    elapsedMs: Math.min(first.elapsedMs, second.elapsedMs),
  });
}
