import { SARA_ANIMATIONS } from '../../content/sara-reactions.ts';
import { selectSaraDialogue, type DialogueMemory } from './sara-dialogue.ts';
import { angerFor } from './chaos.ts';
import type { ReactionDamageFact } from './reaction-damage.ts';

export const HOMECOMING_TIMING = { entering: 1200, reacting: 900 } as const;
const DIALOGUE_AT_MS = HOMECOMING_TIMING.entering + HOMECOMING_TIMING.reacting;

export type HomecomingStage = 'waiting' | 'entering' | 'reacting' | 'dialogue' | 'complete';
export type SaraAnimation = (typeof SARA_ANIMATIONS)[keyof typeof SARA_ANIMATIONS];
export type ReactionSelection = ReturnType<typeof selectReaction>;
export type HomecomingSnapshot = ReturnType<HomecomingSequence['snapshot']>;
interface ReactionContext {
  readonly roomId?: string;
  readonly memory?: DialogueMemory;
  readonly damage?: ReactionDamageFact | null;
}

// eslint-disable-next-line max-lines-per-function -- Eingabeprüfung und unveränderliche Auswahl bilden einen atomaren Vertrag mit genau einer Zufallsziehung.
export function selectReaction(
  score: number,
  random: () => number = Math.random,
  context: ReactionContext = {},
) {
  if (!Number.isSafeInteger(score) || score < 0) throw new Error('Invalid final chaos score');
  const anger = angerFor(score).id;
  const dialogue = selectSaraDialogue(anger, random(), {
    roomId: context.roomId,
    previousDialogue: context.memory?.previous(context.roomId, anger),
    damageTopic: context.damage?.topic,
  });

  return Object.freeze({
    score,
    anger,
    animationKey: SARA_ANIMATIONS[anger],
    dialogue,
    damage: context.damage ? Object.freeze({ ...context.damage }) : null,
  });
}

/** Pure one-shot sequence, driven by active frame time and explicit confirmation; no engine or timer callbacks. */
export class HomecomingSequence {
  private selection: ReactionSelection | null = null;
  private elapsedMs = 0;
  private confirmed = false;
  private readonly context: ReactionContext;

  constructor(context: ReactionContext = {}) {
    this.context = context;
  }

  start(score: number, random: () => number = Math.random, damage = this.context.damage) {
    if (this.selection) return false;
    this.selection = selectReaction(score, random, { ...this.context, damage });
    this.context.memory?.remember(
      this.context.roomId,
      this.selection.anger,
      this.selection.dialogue,
    );

    return true;
  }

  advance(deltaMs: number) {
    if (!this.selection || this.confirmed) return;

    if (!Number.isFinite(deltaMs) || deltaMs <= 0) return;
    this.elapsedMs = Math.min(DIALOGUE_AT_MS, this.elapsedMs + deltaMs);
  }

  confirm() {
    if (this.stage() !== 'dialogue') return false;
    this.confirmed = true;

    return true;
  }

  snapshot() {
    const stage = this.stage();

    return Object.freeze({
      stage,
      elapsedMs: this.elapsedMs,
      selection: this.selection,
      entryProgress: Math.min(1, this.elapsedMs / HOMECOMING_TIMING.entering),
      animationKey: this.animationFor(stage),
    });
  }

  private stage(): HomecomingStage {
    if (!this.selection) return 'waiting';

    if (this.confirmed) return 'complete';

    if (this.elapsedMs < HOMECOMING_TIMING.entering) return 'entering';

    if (this.elapsedMs < HOMECOMING_TIMING.entering + HOMECOMING_TIMING.reacting) return 'reacting';

    return 'dialogue';
  }

  private animationFor(stage: HomecomingStage): SaraAnimation {
    if (stage === 'entering') return SARA_ANIMATIONS.enter;

    if (stage === 'reacting' || stage === 'dialogue')
      return this.selection?.animationKey ?? SARA_ANIMATIONS.idle;

    return SARA_ANIMATIONS.idle;
  }
}
