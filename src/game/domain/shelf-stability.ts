import { assertObjectId, chaosEvent } from './chaos-event.ts';

export type ShelfClass = 'fragile' | 'normal' | 'stable';
export interface ShelfRules {
  readonly warningAt: number;
  readonly damageAt: number;
  readonly collapseAt: number;
  readonly damageValue: number;
  readonly collapseValue: number;
}
export interface ShelfStabilityConfig {
  readonly stability: ShelfClass;
  readonly rules?: ShelfRules;
}
const PRESETS = {
  fragile: { warningAt: 1, damageAt: 2, collapseAt: 3, damageValue: 2, collapseValue: 10 },
  normal: { warningAt: 2, damageAt: 4, collapseAt: 5, damageValue: 2, collapseValue: 10 },
  stable: { warningAt: 0, damageAt: 0, collapseAt: 0, damageValue: 0, collapseValue: 0 },
} as const;

export function shelfRules(config: ShelfStabilityConfig): ShelfRules {
  if (!Object.hasOwn(PRESETS, config.stability)) throw new Error('Invalid shelf stability');

  if (config.stability === 'stable' && config.rules)
    throw new Error('Stable shelf cannot collapse');
  const rules = { ...(config.rules ?? PRESETS[config.stability]) };

  validateValues(rules);

  if (config.stability !== 'stable') validateThresholds(rules);

  return Object.freeze(rules);
}

// eslint-disable-next-line max-lines-per-function -- Alle fünf Pflichtfelder werden ausdrücklich geprüft, damit fehlende Werte nicht durch Object.values übersehen werden.
function validateValues(rules: ShelfRules) {
  const values = [
    rules.warningAt,
    rules.damageAt,
    rules.collapseAt,
    rules.damageValue,
    rules.collapseValue,
  ];

  if (!values.every((value) => Number.isSafeInteger(value) && value >= 0))
    throw new Error('Invalid shelf rules');
}

function validateThresholds(rules: ShelfRules) {
  if (!(
    rules.warningAt > 0 &&
    rules.warningAt < rules.damageAt &&
    rules.damageAt < rules.collapseAt
  ))
    throw new Error('Invalid shelf thresholds');
}

/** Only an observed flight followed by top support counts; standing and walking do not. */
export class ShelfStability {
  private readonly id: string;
  private landings = 0;
  private airborne = false;
  private hasGroundContact = false;
  private readonly rules: ShelfRules;
  private readonly stability: ShelfClass;

  constructor(id: string, config: ShelfStabilityConfig) {
    assertObjectId(id);
    this.id = id;
    this.rules = shelfRules(config);
    this.stability = config.stability;
  }

  observe(airborne: boolean, supported: boolean) {
    const landing = this.airborne && supported && !airborne;

    this.airborne = this.hasGroundContact && airborne;
    this.hasGroundContact ||= !airborne;

    if (!landing || this.stability === 'stable' || this.snapshot().state === 'collapsed') return;
    this.landings++;

    return this.damageEvent();
  }

  private damageEvent() {
    if (this.landings === this.rules.damageAt)
      return chaosEvent(this.id, 'shelf-damage', 1, this.rules.damageValue);

    if (this.landings === this.rules.collapseAt)
      return chaosEvent(this.id, 'collapse', 2, this.rules.collapseValue);
  }

  // eslint-disable-next-line max-lines-per-function -- Die vier Zustände bleiben mit ihren geordneten Schwellwerten direkt vergleichbar.
  snapshot() {
    const state =
      this.stability === 'stable'
        ? 'intact'
        : this.landings >= this.rules.collapseAt
          ? 'collapsed'
          : this.landings >= this.rules.damageAt
            ? 'damaged'
            : this.landings >= this.rules.warningAt
              ? 'wobbly'
              : 'intact';

    return { stability: this.stability, landings: this.landings, state };
  }

  reset() {
    this.landings = 0;
    this.airborne = false;
    this.hasGroundContact = false;
  }
}

/** A short damped impulse; the active round clock freezes it during pause. */
export function shelfWobbleAngle(elapsedMs: number, damaged: boolean) {
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0 || elapsedMs >= 650) return 0;

  return Math.sin((elapsedMs * Math.PI * 6) / 650) * (damaged ? 2 : 1.3) * (1 - elapsedMs / 650);
}
