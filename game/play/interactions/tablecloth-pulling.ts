import { assertObjectId, chaosEvent } from '../domain/chaos-event.ts';
export interface TableclothRules {
  readonly warningMs: number;
  readonly pullMs: number;
  readonly travel: number;
  readonly points: number;
  readonly climbSpeed: number;
}
export const TABLECLOTH_RULES = {
  warningMs: 600,
  pullMs: 2400,
  travel: 240,
  points: 12,
  climbSpeed: 16,
} as const;
export function validateTableclothRules(rules: TableclothRules) {
  if (
    ![rules.warningMs, rules.pullMs, rules.travel, rules.climbSpeed].every(
      (v) => Number.isFinite(v) && v > 0,
    ) ||
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

  // eslint-disable-next-line max-lines-per-function -- Warnung, echte Richtungsumkehr und genau ein vollständiger Endzustand teilen denselben begrenzten Zeitschritt.
  update(delta: number, contact: boolean, direction = 1) {
    if (this.phase === 'displaced') return;
    const step = Number.isFinite(delta) ? Math.max(0, delta) : 0;

    if (!contact) return this.cancel();

    if (this.phase !== 'pulling') return this.warn(step);

    this.pulled = Math.max(
      -this.rules.pullMs,
      Math.min(this.rules.pullMs, this.pulled + (direction < 0 ? -step : step)),
    );

    if (Math.abs(this.pulled) === this.rules.pullMs) return this.displace();
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

  displace(direction = Math.sign(this.pulled) || 1) {
    if (this.phase === 'displaced') return;
    this.phase = 'displaced';
    this.pulled = this.rules.pullMs * (direction < 0 ? -1 : 1);

    return chaosEvent(this.id, 'spill', 1, this.rules.points);
  }

  snapshot() {
    return {
      state: this.phase,
      progress: Math.abs(this.pulled) / this.rules.pullMs,
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
