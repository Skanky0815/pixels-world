import { assertObjectId, chaosEvent, type ChaosEvent } from '../domain/chaos-event.ts';

export const PLANT_NIBBLE = {
  delayMs: 2000,
  nibbleMs: 1000,
  warningMs: 1200,
  nibbleValue: 2,
  tipValue: 10,
} as const;

export interface PlantConfig {
  readonly delayMs: number;
  readonly nibbleMs: number;
  readonly warningMs: number;
  readonly nibbleValue: number;
  readonly tipValue: number;
}

export type PlantDamageEvent = ChaosEvent<'nibble' | 'tip', 1 | 2>;

type PlantState = 'idle' | 'waiting' | 'nibbling' | 'wobbling' | 'tipped';

/** Predictable, interruptible sequence; each damage stage is emitted once until reset. */
export class PlantNibbling {
  private phase: PlantState = 'idle';
  private elapsed = 0;
  private damage = 0;
  private readonly objectId: string;
  private readonly config: PlantConfig;

  // eslint-disable-next-line max-lines-per-function -- Zeit- und Punktparameter werden als zwei zusammengehörige Validierungsgruppen vor dem Kopieren geprüft.
  constructor(config: PlantConfig = PLANT_NIBBLE, objectId = 'plant') {
    assertObjectId(objectId);
    this.objectId = objectId;

    if (
      ![config.delayMs, config.nibbleMs, config.warningMs].every(
        (value) => Number.isFinite(value) && value > 0,
      ) ||
      ![config.nibbleValue, config.tipValue].every(
        (value) => Number.isSafeInteger(value) && value >= 0,
      )
    )
      throw new Error('Invalid plant configuration');
    this.config = { ...config };
  }

  update(deltaMs: number, eligible: boolean): PlantDamageEvent | undefined {
    if (this.phase === 'tipped') return;

    if (!eligible) return this.stopNibbling();

    if (this.phase === 'idle') this.phase = 'waiting';
    this.elapsed += Number.isFinite(deltaMs) ? Math.max(0, deltaMs) : 0;

    return this.advancePhase();
  }

  private stopNibbling(): undefined {
    this.phase = 'idle';
    this.elapsed = 0;
  }

  private advancePhase(): PlantDamageEvent | undefined {
    if (this.phase === 'waiting' && this.elapsed >= this.config.delayMs)
      return this.startNibbling();

    if (this.phase === 'nibbling' && this.elapsed >= this.config.nibbleMs) {
      this.phase = 'wobbling';
      this.elapsed = 0;
    } else if (this.phase === 'wobbling' && this.elapsed >= this.config.warningMs)
      return this.tip();
  }

  private startNibbling(): PlantDamageEvent | undefined {
    this.phase = 'nibbling';
    this.elapsed = 0;

    if (this.damage !== 0) return;
    this.damage = 1;

    return chaosEvent(this.objectId, 'nibble', 1, this.config.nibbleValue);
  }

  private tip(): PlantDamageEvent {
    this.phase = 'tipped';
    this.elapsed = 0;
    this.damage = 2;

    return chaosEvent(this.objectId, 'tip', 2, this.config.tipValue);
  }

  // eslint-disable-next-line max-lines-per-function -- Phasenabhängige Dauer und der flache Fortschrittssnapshot bleiben gemeinsam nachvollziehbar.
  snapshot() {
    const duration =
      this.phase === 'waiting'
        ? this.config.delayMs
        : this.phase === 'nibbling'
          ? this.config.nibbleMs
          : this.config.warningMs;

    return {
      state: this.phase,
      damage: this.damage,
      progress: Math.min(this.elapsed / duration, 1),
    };
  }

  reset() {
    this.phase = 'idle';
    this.elapsed = 0;
    this.damage = 0;
  }
}
