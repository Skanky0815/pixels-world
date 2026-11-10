import { SARA_DAMAGE_RULES, type SaraDamageTopic } from '../../content/sara-reactions.ts';
import type { ChaosEvent } from './chaos-event.ts';

export interface ReactionDamageFact {
  readonly topic: SaraDamageTopic;
  readonly objectId: string;
  readonly stage: number;
  readonly priority: number;
}

/** Remembers only the most notable accepted damage, never awards or aggregates score. */
export class ReactionDamage {
  private selected: ReactionDamageFact | null = null;

  // eslint-disable-next-line max-lines-per-function -- Nur passende Objekt-/Ereignispaare erzeugen einen losgelösten, eingefrorenen Kandidaten für den Prioritätsvergleich.
  record(event: ChaosEvent, objectKind: string | undefined) {
    const rule = SARA_DAMAGE_RULES.find(
      (rule) => rule.objectKind === objectKind && rule.eventKind === event.kind,
    );

    if (!rule) return;
    const next = Object.freeze({
      topic: rule.topic,
      objectId: event.objectId,
      stage: event.stage,
      priority: rule.priority,
    });

    if (!this.selected || outranks(next, this.selected)) this.selected = next;
  }

  snapshot() {
    return this.selected;
  }

  reset() {
    this.selected = null;
  }
}

function outranks(next: ReactionDamageFact, current: ReactionDamageFact) {
  if (next.priority !== current.priority) return next.priority > current.priority;

  if (next.stage !== current.stage) return next.stage > current.stage;

  return next.objectId < current.objectId;
}
