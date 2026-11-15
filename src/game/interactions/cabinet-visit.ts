import { assertObjectId, chaosEvent } from '../domain/chaos-event.ts';

export const CABINET_VISIT_RULES = {
  warningMs: 500,
  hangingMs: 600,
  openingMs: 400,
  insideMs: 1400,
  points: 0,
} as const;
export interface CabinetVisitRules {
  readonly warningMs: number;
  readonly hangingMs: number;
  readonly openingMs: number;
  readonly insideMs: number;
  readonly points: number;
}

/** The first deliberate jump warns; the second starts one bounded visit. */
export class CabinetVisit {
  private state: 'idle' | 'warning' | 'hanging' | 'opening' | 'inside' | 'open' = 'idle';
  private elapsed = 0;
  private bumps = 0;
  private jumpArmed = false;
  private readonly id: string;
  private readonly rules: CabinetVisitRules;
  // eslint-disable-next-line max-lines-per-function -- ID, Zeiten und Punkte werden vor dem ersten Zustandsschritt zusammen geprüft.
  constructor(id: string, rules: CabinetVisitRules = CABINET_VISIT_RULES) {
    this.id = id;
    assertObjectId(id);

    if (
      ![rules.warningMs, rules.hangingMs, rules.openingMs, rules.insideMs].every(
        (n) => Number.isFinite(n) && n > 0,
      ) ||
      !Number.isSafeInteger(rules.points) ||
      rules.points < 0
    )
      throw new Error('Invalid cabinet visit rules');
    this.rules = { ...rules };
  }

  // eslint-disable-next-line max-lines-per-function, complexity -- Ein Ansprung wird genau einmal gezählt; nur der freigegebene Griffkontakt startet die begrenzte Aufnahme.
  observeJump(
    started: boolean,
    grounded: boolean,
    touching: boolean,
    climbing = false,
    handle = false,
  ) {
    if (this.snapshot().captured || this.state === 'open') return;
    this.trackJump(started, grounded, climbing);

    if (grounded || !touching || !this.jumpArmed) return;

    if (this.bumps === 1 && !handle) return;
    this.jumpArmed = false;
    this.bumps = Math.min(2, this.bumps + 1);
    this.state = this.bumps === 1 ? 'warning' : 'hanging';
    this.elapsed = 0;

    return this.bumps;
  }

  private trackJump(started: boolean, grounded: boolean, climbing: boolean) {
    if (grounded || climbing) this.jumpArmed = started && grounded && !climbing;
  }

  // eslint-disable-next-line max-lines-per-function, complexity -- Die begrenzten Türphasen teilen aktive Zeit und liefern genau ein Abschlussereignis.
  update(delta: number) {
    if (this.state === 'idle' || this.state === 'open') return;
    const step = Number.isFinite(delta) ? Math.max(0, delta) : 0;

    this.elapsed += step;

    if (this.state === 'hanging' && this.elapsed >= this.rules.hangingMs) {
      this.state = 'opening';
      this.elapsed = 0;
    } else if (this.state === 'opening' && this.elapsed >= this.rules.openingMs) {
      this.state = 'inside';
      this.elapsed = 0;
    }

    if (this.state === 'inside' && this.elapsed >= this.rules.insideMs) return this.open();

    if (this.state === 'warning' && this.elapsed >= this.rules.warningMs) {
      this.state = 'idle';
      this.elapsed = 0;
    }
  }

  disturb() {
    // A foreign hit can ruin the contents, but never hide or capture Pixel.
    if (!this.snapshot().captured && this.state !== 'open') return this.open();
  }

  private open() {
    this.state = 'open';
    this.elapsed = 0;

    return chaosEvent(this.id, 'spill', 1, this.rules.points);
  }

  // eslint-disable-next-line max-lines-per-function -- Ein unveränderter lesender Zustand beschreibt Eingabesperre, Sichtbarkeit und Türfortschritt für jeden Möbeladapter.
  snapshot() {
    return {
      state: this.state,
      bumps: this.bumps,
      hidden: this.state === 'inside',
      captured: ['hanging', 'opening', 'inside'].includes(this.state),
      doorProgress:
        this.state === 'opening'
          ? Math.min(1, this.elapsed / this.rules.openingMs)
          : this.state === 'inside' || this.state === 'open'
            ? 1
            : 0,
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
