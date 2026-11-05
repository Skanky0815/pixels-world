import { SARA_ANIMATIONS, SARA_DIALOGUE } from '../../content/sara-reactions.ts';
import { angerFor } from './chaos.ts';

export const HOMECOMING_TIMING = { entering: 1200, reacting: 900, dialogue: 3600 } as const;
export type HomecomingStage = 'waiting' | 'entering' | 'reacting' | 'dialogue' | 'complete';
export type SaraAnimation = (typeof SARA_ANIMATIONS)[keyof typeof SARA_ANIMATIONS];
export type ReactionSelection = ReturnType<typeof selectReaction>;
export type HomecomingSnapshot = ReturnType<HomecomingSequence['snapshot']>;

// eslint-disable-next-line max-lines-per-function -- Eingabeprüfung und unveränderliche Auswahl bilden einen atomaren Vertrag mit genau einer Zufallsziehung.
export function selectReaction(score: number, random: () => number = Math.random) {
  if (!Number.isSafeInteger(score) || score < 0) throw new Error('Invalid final chaos score');
  const anger = angerFor(score).id;
  const pool = SARA_DIALOGUE[anger];
  const index = chooseIndex(pool.length, random());

  return Object.freeze({
    score,
    anger,
    animationKey: SARA_ANIMATIONS[anger],
    dialogue: pool[index],
  });
}

function chooseIndex(length: number, sample: number) {
  if (!Number.isFinite(sample) || sample < 0 || sample > 1)
    throw new Error('Invalid random sample');

  return Math.min(length - 1, Math.floor(sample * length));
}

/** Pure one-shot sequence, driven only by active frame time; no engine or timer callbacks. */
export class HomecomingSequence {
  private selection: ReactionSelection | null = null;
  private elapsedMs = 0;

  start(score: number, random: () => number = Math.random) {
    if (this.selection) return false;
    this.selection = selectReaction(score, random);

    return true;
  }

  advance(deltaMs: number) {
    if (!this.selection || this.stage() === 'complete') return false;

    if (!Number.isFinite(deltaMs) || deltaMs <= 0) return false;
    this.elapsedMs = Math.min(totalDuration(), this.elapsedMs + deltaMs);

    return this.stage() === 'complete';
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

    if (this.elapsedMs < HOMECOMING_TIMING.entering) return 'entering';

    if (this.elapsedMs < HOMECOMING_TIMING.entering + HOMECOMING_TIMING.reacting) return 'reacting';

    return this.elapsedMs < totalDuration() ? 'dialogue' : 'complete';
  }

  private animationFor(stage: HomecomingStage): SaraAnimation {
    if (stage === 'entering') return SARA_ANIMATIONS.enter;

    if (stage === 'reacting' || stage === 'dialogue')
      return this.selection?.animationKey ?? SARA_ANIMATIONS.idle;

    return SARA_ANIMATIONS.idle;
  }
}

function totalDuration() {
  return HOMECOMING_TIMING.entering + HOMECOMING_TIMING.reacting + HOMECOMING_TIMING.dialogue;
}
