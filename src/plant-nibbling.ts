export const PLANT_NIBBLE = {
  delayMs: 2000,
  nibbleMs: 1000,
  warningMs: 1200,
  nibbleValue: 2,
  tipValue: 10,
  x: 82,
  minX: 44,
  maxX: 104,
} as const;

export interface PlantConfig {
  readonly delayMs: number;
  readonly nibbleMs: number;
  readonly warningMs: number;
  readonly nibbleValue: number;
  readonly tipValue: number;
}

export interface PlantDamageEvent {
  readonly objectId: 'plant';
  readonly kind: 'nibble' | 'tip';
  readonly stage: 1 | 2;
  readonly value: number;
}

type PlantState = 'idle' | 'waiting' | 'nibbling' | 'wobbling' | 'tipped';

/** Predictable, interruptible sequence; each damage stage is emitted once until reset. */
export class PlantNibbling {
  private phase: PlantState = 'idle';
  private elapsed = 0;
  private damage = 0;
  private readonly config: PlantConfig;

  constructor(config: PlantConfig = PLANT_NIBBLE) {
    if (![config.delayMs, config.nibbleMs, config.warningMs].every(value => Number.isFinite(value) && value > 0) ||
      ![config.nibbleValue, config.tipValue].every(value => Number.isSafeInteger(value) && value >= 0)) throw new Error('Invalid plant configuration');
    this.config = { ...config };
  }

  update(deltaMs: number, eligible: boolean): PlantDamageEvent | undefined {
    if (this.phase === 'tipped') return;
    if (!eligible) {
      this.phase = 'idle';
      this.elapsed = 0;
      return;
    }
    if (this.phase === 'idle') this.phase = 'waiting';
    this.elapsed += Number.isFinite(deltaMs) ? Math.max(0, deltaMs) : 0;
    if (this.phase === 'waiting' && this.elapsed >= this.config.delayMs) {
      this.phase = 'nibbling';
      this.elapsed = 0;
      if (this.damage === 0) {
        this.damage = 1;
        return Object.freeze({ objectId: 'plant', kind: 'nibble', stage: 1, value: this.config.nibbleValue });
      }
    } else if (this.phase === 'nibbling' && this.elapsed >= this.config.nibbleMs) {
      this.phase = 'wobbling';
      this.elapsed = 0;
    } else if (this.phase === 'wobbling' && this.elapsed >= this.config.warningMs) {
      this.phase = 'tipped';
      this.elapsed = 0;
      this.damage = 2;
      return Object.freeze({ objectId: 'plant', kind: 'tip', stage: 2, value: this.config.tipValue });
    }
  }

  snapshot() {
    const duration = this.phase === 'waiting' ? this.config.delayMs : this.phase === 'nibbling' ? this.config.nibbleMs : this.config.warningMs;
    return { state: this.phase, damage: this.damage, progress: Math.min(this.elapsed / duration, 1) };
  }

  reset() {
    this.phase = 'idle';
    this.elapsed = 0;
    this.damage = 0;
  }
}
