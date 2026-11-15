import { assertObjectId, chaosEvent } from '../domain/chaos-event.ts';

export const FOOD_BAG_RULES = { warningMs: 700, fallMs: 500, points: 18 } as const;
export interface TopplingRules {
  readonly warningMs: number;
  readonly fallMs: number;
  readonly points: number;
}

/** Active simulation time only; leaving during the warning cancels all progress. */
export class Toppling<S extends 'upright' | 'stacked'> {
  readonly id: string;
  private phase: S | 'wobbling' | 'falling' | 'fallen';
  private readonly initialState: S;
  private readonly eventKind: 'topple' | 'spill';
  private elapsed = 0;
  private readonly rules: TopplingRules;

  // eslint-disable-next-line max-lines-per-function -- Zeit- und Punktevertrag werden gemeinsam vor dem ersten Update validiert.
  constructor(id: string, rules: TopplingRules, eventKind: 'topple' | 'spill', initialState: S) {
    this.initialState = initialState;
    this.phase = initialState;
    this.eventKind = eventKind;
    assertObjectId(id);
    this.id = id;

    if (
      ![rules.warningMs, rules.fallMs].every((n) => Number.isFinite(n) && n > 0) ||
      !Number.isSafeInteger(rules.points) ||
      rules.points < 0
    )
      throw new Error('Invalid toppling configuration');
    this.rules = { ...rules };
  }

  // eslint-disable-next-line max-lines-per-function -- Kontaktwarnung, Abbruch und unumkehrbarer Fall bleiben als ein Zustandsübergang sichtbar.
  update(delta: number, contact: boolean) {
    if (this.phase === 'fallen') return;
    const step = Number.isFinite(delta) ? Math.max(0, delta) : 0;

    if (this.phase === 'falling') return this.fall(step);

    if (!contact) {
      this.reset();

      return;
    }

    this.phase = 'wobbling';
    this.elapsed += step;

    if (this.elapsed >= this.rules.warningMs) {
      this.phase = 'falling';
      this.elapsed = 0;
    }
  }

  private fall(delta: number) {
    this.elapsed += delta;

    if (this.elapsed < this.rules.fallMs) return;
    this.phase = 'fallen';

    return chaosEvent(this.id, this.eventKind, 1, this.rules.points);
  }

  releaseSupport() {
    this.knockOver();
  }

  knockOver() {
    if (this.phase === 'falling' || this.phase === 'fallen') return false;
    this.phase = 'falling';
    this.elapsed = 0;

    return true;
  }

  snapshot() {
    return {
      state: this.phase,
      progress:
        this.phase === 'fallen'
          ? 1
          : this.elapsed / (this.phase === 'falling' ? this.rules.fallMs : this.rules.warningMs),
    };
  }

  reset() {
    this.phase = this.initialState;
    this.elapsed = 0;
  }
}
