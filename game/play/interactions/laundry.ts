import type { TopplingRules } from './toppling.ts';
import { chaosEvent, assertObjectId } from '../domain/chaos-event.ts';

export const LAUNDRY_RULES = { warningMs: 450, fallMs: 650, points: 10 } as const;
export type LaundryAppearance = 'pile' | 'basket';

/** Resting is harmless. Only treading, rolling or an actual impact advances damage. */
export class LaundryMotion {
  private stage = 0;
  private elapsed = 0;
  private forced = false;

  private readonly id: string;
  private readonly rules: TopplingRules;

  // eslint-disable-next-line max-lines-per-function -- Identität und endliche Zeit-/Punktewerte werden zusammen validiert.
  constructor(id: string, rules: TopplingRules = LAUNDRY_RULES) {
    this.id = id;
    this.rules = { ...rules };
    assertObjectId(id);

    if (
      ![rules.warningMs, rules.fallMs].every((n) => Number.isFinite(n) && n > 0) ||
      !Number.isSafeInteger(rules.points) ||
      rules.points < 0
    )
      throw new Error('Invalid laundry configuration');
  }

  // eslint-disable-next-line max-lines-per-function -- Zwei deduplizierte Schadensstufen und aktive Zeit bilden denselben Ablauf für Trampeln und Fremdstöße.
  advance(delta: number, disturbing: boolean) {
    if (this.stage === 2 || !Number.isFinite(delta) || delta <= 0) return;

    if (!disturbing && !this.forced) {
      this.elapsed = 0;

      return;
    }

    this.elapsed += delta;
    const duration = this.stage === 0 ? this.rules.warningMs : this.rules.fallMs;

    if (this.elapsed < duration) return;
    this.elapsed = 0;
    this.stage++;

    return chaosEvent(this.id, 'spill', this.stage, this.rules.points);
  }

  knockOver() {
    if (this.stage === 2 || this.forced) return false;
    this.forced = true;

    return true;
  }

  snapshot() {
    return {
      stage: this.stage,
      progress: this.elapsed / (this.stage ? this.rules.fallMs : this.rules.warningMs),
      forced: this.forced,
    };
  }

  reset() {
    this.stage = 0;
    this.elapsed = 0;
    this.forced = false;
  }
}
