import { assertObjectId, chaosEvent } from '../domain/chaos-event.ts';

export const CABINET_VISIT_RULES = {
  hangingMs: 600,
  openingMs: 400,
  enteringMs: 200,
  insideMs: 1400,
  reopeningMs: 400,
  points: 0,
} as const;
export interface CabinetVisitRules {
  readonly hangingMs: number;
  readonly openingMs: number;
  readonly enteringMs: number;
  readonly insideMs: number;
  readonly reopeningMs: number;
  readonly points: number;
}

/** A deliberate jump onto the handle starts one bounded visit. */
export class CabinetVisit {
  private state: 'idle' | 'hanging' | 'opening' | 'entering' | 'inside' | 'reopening' | 'open' =
    'idle';

  private elapsed = 0;
  private jumpArmed = false;
  private damaged = false;
  private readonly id: string;
  private readonly rules: CabinetVisitRules;
  // eslint-disable-next-line max-lines-per-function -- ID, Zeiten und Punkte werden vor dem ersten Zustandsschritt zusammen geprüft.
  constructor(id: string, rules: CabinetVisitRules = CABINET_VISIT_RULES) {
    this.id = id;
    assertObjectId(id);

    if (
      ![
        rules.hangingMs,
        rules.openingMs,
        rules.enteringMs,
        rules.insideMs,
        rules.reopeningMs,
      ].every((n) => Number.isFinite(n) && n > 0) ||
      !Number.isSafeInteger(rules.points) ||
      rules.points < 0
    )
      throw new Error('Invalid cabinet visit rules');
    this.rules = { ...rules };
  }

  // eslint-disable-next-line max-lines-per-function, complexity -- Nur ein freigegebener Sprung mit Griffkontakt startet die begrenzte Aufnahme.
  observeJump(
    started: boolean,
    grounded: boolean,
    touching: boolean,
    climbing = false,
    handle = false,
    rising = false,
  ) {
    if (this.snapshot().captured || this.state === 'open') return;
    this.trackJump(started, grounded, climbing, rising);

    if (grounded || !touching || !handle || !this.jumpArmed) return;

    this.jumpArmed = false;
    this.state = 'hanging';
    this.elapsed = 0;

    return true;
  }

  private trackJump(started: boolean, grounded: boolean, climbing: boolean, rising: boolean) {
    if (climbing) this.jumpArmed = false;
    else if (started && grounded) this.jumpArmed = true;
    else if (grounded && !rising) this.jumpArmed = false;
  }

  // eslint-disable-next-line max-lines-per-function -- Die begrenzten Türphasen teilen aktive Zeit und liefern genau ein Abschlussereignis.
  update(delta: number) {
    if (this.state === 'idle' || this.state === 'open') return;
    const step = Number.isFinite(delta) ? Math.max(0, delta) : 0;

    this.elapsed += step;

    const duration = {
      hanging: this.rules.hangingMs,
      opening: this.rules.openingMs,
      entering: this.rules.enteringMs,
      inside: this.rules.insideMs,
      reopening: this.rules.reopeningMs,
    };

    if (this.elapsed < duration[this.state]) return;

    if (this.state === 'reopening') return this.open();
    const next = {
      hanging: 'opening',
      opening: 'entering',
      entering: 'inside',
      inside: 'reopening',
    } as const;

    this.state = next[this.state];
    this.elapsed = 0;
  }

  disturb() {
    // Foreign damage never completes a visit or changes the door/capture phases.
    if (!this.snapshot().captured && this.state !== 'open') return this.damage();
  }

  private open() {
    this.state = 'open';
    this.elapsed = 0;

    return this.damage();
  }

  private damage() {
    if (this.damaged) return;
    this.damaged = true;

    return chaosEvent(this.id, 'spill', 1, this.rules.points);
  }

  // eslint-disable-next-line max-lines-per-function -- Ein unveränderter lesender Zustand beschreibt Eingabesperre, Sichtbarkeit und Türfortschritt für jeden Möbeladapter.
  snapshot() {
    return {
      state: this.state,
      hidden: ['entering', 'inside', 'reopening'].includes(this.state),
      captured: ['hanging', 'opening', 'entering', 'inside', 'reopening'].includes(this.state),
      doorState:
        this.state === 'open'
          ? 'open'
          : ['opening', 'entering', 'reopening'].includes(this.state)
            ? 'ajar'
            : 'closed',
      doorProgress:
        this.state === 'open'
          ? 1
          : ['opening', 'entering', 'reopening'].includes(this.state)
            ? 0.1
            : 0,
      progress: this.state === 'inside' ? Math.min(1, this.elapsed / this.rules.insideMs) : 0,
    };
  }

  abort() {
    this.state = 'idle';
    this.elapsed = 0;
    this.jumpArmed = false;
  }

  reset() {
    this.abort();
    this.damaged = false;
  }
}
