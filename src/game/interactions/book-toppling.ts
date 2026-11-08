import { assertObjectId, chaosEvent } from '../domain/chaos-event.ts';

export const BOOK_TOPPLE = { warningMs: 1000, fallMs: 450, points: 12 } as const;
export interface BookRules {
  readonly warningMs: number;
  readonly fallMs: number;
  readonly points: number;
}

/** Active simulation time only; leaving during the warning cancels all progress. */
export class BookToppling {
  readonly id: string;
  private phase: 'stacked' | 'wobbling' | 'falling' | 'fallen' = 'stacked';
  private elapsed = 0;
  private readonly rules: BookRules;

  // eslint-disable-next-line max-lines-per-function -- Zeit- und Punktevertrag werden gemeinsam vor dem ersten Update validiert.
  constructor(id: string, rules: BookRules = BOOK_TOPPLE) {
    assertObjectId(id);
    this.id = id;

    if (
      ![rules.warningMs, rules.fallMs].every((n) => Number.isFinite(n) && n > 0) ||
      !Number.isSafeInteger(rules.points) ||
      rules.points < 0
    )
      throw new Error('Invalid book configuration');
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

    return chaosEvent(this.id, 'topple', 1, this.rules.points);
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
    this.phase = 'stacked';
    this.elapsed = 0;
  }
}
