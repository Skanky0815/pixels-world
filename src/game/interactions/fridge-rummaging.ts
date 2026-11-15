import { assertObjectId, chaosEvent } from '../domain/chaos-event.ts';

export const FRIDGE_RULES = { warningMs: 500, insideMs: 1400, points: 24 } as const;
export interface FridgeRules {
  readonly warningMs: number;
  readonly insideMs: number;
  readonly points: number;
}

/** A cancellable invitation followed by a bounded visit; no score until the door opens. */
export class FridgeRummaging {
  private state: 'idle' | 'warning' | 'inside' | 'open' = 'idle';
  private elapsed = 0;
  private readonly id: string;
  private readonly rules: FridgeRules;
  // eslint-disable-next-line max-lines-per-function -- ID, Zeiten und Punkte werden vor dem ersten Zustandsschritt zusammen geprüft.
  constructor(id: string, rules: FridgeRules = FRIDGE_RULES) {
    this.id = id;
    assertObjectId(id);

    if (
      ![rules.warningMs, rules.insideMs].every((n) => Number.isFinite(n) && n > 0) ||
      !Number.isSafeInteger(rules.points) ||
      rules.points < 0
    )
      throw new Error('Invalid fridge rules');
    this.rules = { ...rules };
  }

  // eslint-disable-next-line max-lines-per-function -- Abbrechbare Warnung, begrenzter Besuch und einmaliger Abschluss teilen denselben aktiven Zeitschritt.
  update(delta: number, active: boolean) {
    if (this.state === 'open') return;
    const step = Number.isFinite(delta) ? Math.max(0, delta) : 0;

    if (this.state === 'inside') {
      this.elapsed += step;

      if (this.elapsed >= this.rules.insideMs) return this.open();

      return;
    }

    if (!active) {
      this.reset();

      return;
    }

    this.state = 'warning';
    this.elapsed += step;

    if (this.elapsed >= this.rules.warningMs) {
      this.state = 'inside';
      this.elapsed = 0;
    }
  }

  disturb() {
    // A foreign hit can ruin the contents, but never hide or capture Pixel.
    if (this.state !== 'inside' && this.state !== 'open') return this.open();
  }

  private open() {
    this.state = 'open';
    this.elapsed = 0;

    return chaosEvent(this.id, 'spill', 1, this.rules.points);
  }

  snapshot() {
    return {
      state: this.state,
      hidden: this.state === 'inside',
      progress: this.state === 'inside' ? Math.min(1, this.elapsed / this.rules.insideMs) : 0,
    };
  }

  reset() {
    this.state = 'idle';
    this.elapsed = 0;
  }
}
