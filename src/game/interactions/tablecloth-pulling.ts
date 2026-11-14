import { assertObjectId, chaosEvent } from '../domain/chaos-event.ts';
export interface TableclothRules {
  readonly warningMs: number;
  readonly pullMs: number;
  readonly travel: number;
  readonly points: number;
}
export const TABLECLOTH_RULES = { warningMs: 600, pullMs: 2400, travel: 240, points: 12 } as const;
export function validateTableclothRules(rules: TableclothRules) {
  if (
    ![rules.warningMs, rules.pullMs, rules.travel].every((v) => Number.isFinite(v) && v > 0) ||
    !Number.isSafeInteger(rules.points) ||
    rules.points < 0
  )
    throw new Error('Invalid tablecloth configuration');
}

/** Warning can be cancelled; a displaced cloth never rewinds its actual movement. */
export class TableclothPull {
  private phase: 'idle' | 'warning' | 'pulling' | 'displaced' = 'idle';
  private warning = 0;
  private pulled = 0;
  readonly id: string;
  private readonly rules: TableclothRules;
  constructor(id: string, rules: TableclothRules) {
    assertObjectId(id);
    validateTableclothRules(rules);
    this.id = id;
    this.rules = { ...rules };
  }

  update(delta: number, contact: boolean) {
    if (this.phase === 'displaced') return;
    const step = Number.isFinite(delta) ? Math.max(0, delta) : 0;

    if (!contact) return this.cancel();

    if (this.phase !== 'pulling') return this.warn(step);

    this.pulled = Math.min(this.rules.pullMs, this.pulled + step);

    if (this.pulled === this.rules.pullMs) return this.displace();
  }

  private cancel() {
    this.phase = 'idle';
    this.warning = 0;

    return undefined;
  }

  private warn(delta: number) {
    this.phase = 'warning';
    this.warning += delta;

    if (this.warning >= this.rules.warningMs) this.phase = 'pulling';

    return undefined;
  }

  impulse() {
    if (this.phase !== 'displaced') this.phase = 'pulling';
  }

  displace() {
    if (this.phase === 'displaced') return;
    this.phase = 'displaced';
    this.pulled = this.rules.pullMs;

    return chaosEvent(this.id, 'spill', 1, this.rules.points);
  }

  snapshot() {
    return {
      state: this.phase,
      progress: this.pulled / this.rules.pullMs,
      warning: Math.min(1, this.warning / this.rules.warningMs),
      offset: (this.rules.travel * this.pulled) / this.rules.pullMs,
    };
  }

  reset() {
    this.phase = 'idle';
    this.warning = 0;
    this.pulled = 0;
  }
}
