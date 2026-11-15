import { assertObjectId, chaosEvent } from '../domain/chaos-event.ts';

export const FRIDGE_RULES = { warningMs: 500, insideMs: 1400, points: 24 } as const;
export interface FridgeRules {
  readonly warningMs: number;
  readonly insideMs: number;
  readonly points: number;
}

/** The first deliberate jump warns; the second starts one bounded visit. */
export class FridgeRummaging {
  private state: 'idle' | 'warning' | 'inside' | 'open' = 'idle';
  private elapsed = 0;
  private bumps = 0;
  private jumpArmed = false;
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

  observeJump(started: boolean, grounded: boolean, touching: boolean, climbing = false) {
    if (this.state === 'inside' || this.state === 'open') return;
    this.trackJump(started, grounded, climbing);

    if (grounded || !touching || !this.jumpArmed) return;
    this.jumpArmed = false;
    this.bumps = Math.min(2, this.bumps + 1);
    this.state = this.bumps === 1 ? 'warning' : 'inside';
    this.elapsed = 0;

    return this.bumps;
  }

  private trackJump(started: boolean, grounded: boolean, climbing: boolean) {
    if (grounded || climbing) this.jumpArmed = started && grounded && !climbing;
  }

  update(delta: number) {
    if (this.state !== 'warning' && this.state !== 'inside') return;
    const step = Number.isFinite(delta) ? Math.max(0, delta) : 0;

    this.elapsed += step;

    if (this.state === 'inside' && this.elapsed >= this.rules.insideMs) return this.open();

    if (this.state === 'warning' && this.elapsed >= this.rules.warningMs) {
      this.state = 'idle';
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
      bumps: this.bumps,
      hidden: this.state === 'inside',
      progress: this.state === 'inside' ? Math.min(1, this.elapsed / this.rules.insideMs) : 0,
    };
  }

  reset() {
    this.state = 'idle';
    this.elapsed = 0;
    this.bumps = 0;
    this.jumpArmed = false;
  }
}
