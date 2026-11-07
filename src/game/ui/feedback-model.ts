import { FEEDBACK, DAMAGE_FEEDBACK, PHASE_FEEDBACK } from '../../content/feedback.ts';
import type { TextKey } from '../../i18n/locale.ts';
import type { ChaosEvent } from '../domain/chaos-event.ts';
import type { ReconciliationSnapshot } from '../domain/reconciliation.ts';
import type { RoundSnapshot } from '../domain/round-controller.ts';

export type FeedbackChannel = 'score' | 'phase' | 'charm';
export interface FeedbackState {
  readonly started: boolean;
  readonly round: RoundSnapshot;
  readonly charm: ReconciliationSnapshot;
  readonly outcome: 'success' | 'failed' | null;
}
export interface FeedbackMessage {
  readonly id: number;
  readonly key: TextKey;
  readonly value: number;
  readonly tone: 'positive' | 'negative' | 'phase';
  readonly durationMs: number;
  readonly elapsedMs: number;
}

/** Read-only presentation observer: it cannot mutate models, score, input or time limits. */
export class FeedbackModel {
  private readonly seen = new Set<string>();
  private readonly messages = new Map<FeedbackChannel, FeedbackMessage>();
  private sequence = 0;
  private phase = 'intro';
  private charm: ReconciliationSnapshot | undefined;

  damage(event: ChaosEvent) {
    if (this.seen.has(event.id)) return;
    this.seen.add(event.id);
    this.show('score', DAMAGE_FEEDBACK[event.kind], 'positive', FEEDBACK.scoreMs, event.value);
  }

  advance(delta: number, state: FeedbackState) {
    for (const [channel, message] of this.messages) this.age(channel, message, delta);
    this.observePhase(state);
    this.observeCharm(state.charm);
  }

  private age(channel: FeedbackChannel, message: FeedbackMessage, delta: number) {
    const elapsedMs = message.elapsedMs + (Number.isFinite(delta) ? Math.max(0, delta) : 0);

    if (elapsedMs >= message.durationMs) this.messages.delete(channel);
    else this.messages.set(channel, Object.freeze({ ...message, elapsedMs }));
  }

  private observePhase(state: FeedbackState) {
    const phase = state.started ? (state.outcome ?? state.round.phase) : 'intro';
    const tone = phase === 'failed' ? 'negative' : phase === 'success' ? 'positive' : 'phase';

    if (phase === this.phase) return;
    this.phase = phase;

    if (phase !== 'intro') this.show('phase', PHASE_FEEDBACK[phase], tone, FEEDBACK.phaseMs);
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
    this.messages.set(
      channel,
      Object.freeze({ id: ++this.sequence, key, value, tone, durationMs, elapsedMs: 0 }),
    );
  }

  snapshot() {
    return Object.freeze({
      sequence: this.sequence,
      messages: Object.freeze(Object.fromEntries(this.messages)) as Readonly<
        Partial<Record<FeedbackChannel, FeedbackMessage>>
      >,
    });
  }
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
