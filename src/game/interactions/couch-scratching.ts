import { assertObjectId, chaosEvent, type ChaosEvent } from '../domain/chaos-event.ts';

export const COUCH_SCRATCH = {
  delayMs: 2000,
  damageIntervalMs: 750,
  maxDamage: 6,
  damageValue: 3,
} as const;

export interface ScratchConfig {
  readonly delayMs: number;
  readonly damageIntervalMs: number;
  readonly maxDamage: number;
  readonly damageValue: number;
}

export type CouchDamageEvent = ChaosEvent<'scratch'>;

/** A bounded interaction, independent of rendering and future score calculation. */
export class CouchScratching {
  private phase: 'idle' | 'waiting' | 'scratching' = 'idle';
  private waited = 0;
  private sinceDamage = 0;
  private damage = 0;
  private readonly objectId: string;
  private readonly config: ScratchConfig;

  // eslint-disable-next-line complexity, max-lines-per-function -- Zusammenhängende Validierung des Konfigurationsvertrags bleibt zur Übersicht an einer Stelle.
  constructor(config: ScratchConfig = COUCH_SCRATCH, objectId = 'couch') {
    assertObjectId(objectId);
    this.objectId = objectId;

    if (
      !Number.isFinite(config.delayMs) ||
      config.delayMs < 0 ||
      !Number.isFinite(config.damageIntervalMs) ||
      config.damageIntervalMs <= 0 ||
      !Number.isSafeInteger(config.maxDamage) ||
      config.maxDamage <= 0 ||
      !Number.isSafeInteger(config.damageValue) ||
      config.damageValue < 0
    )
      throw new Error('Invalid scratch configuration');
    this.config = { ...config };
  }

  update(deltaMs: number, eligible: boolean): CouchDamageEvent | undefined {
    if (!eligible) return this.stopScratching();

    const elapsed = Number.isFinite(deltaMs) ? Math.max(0, deltaMs) : 0;

    if (this.phase !== 'scratching') return this.waitForScratching(elapsed);

    return this.continueScratching(elapsed);
  }

  private stopScratching(): undefined {
    this.phase = 'idle';
    this.waited = 0;
    this.sinceDamage = 0;
  }

  private waitForScratching(elapsed: number): CouchDamageEvent | undefined {
    this.phase = 'waiting';
    this.waited += elapsed;

    if (this.waited < this.config.delayMs) return;
    this.phase = 'scratching';
    this.sinceDamage = 0;

    return this.nextDamage();
  }

  private continueScratching(elapsed: number): CouchDamageEvent | undefined {
    this.sinceDamage += elapsed;

    if (this.sinceDamage < this.config.damageIntervalMs) return;
    // One event at most per update, even after a delayed frame; never burst-catch-up.
    this.sinceDamage %= this.config.damageIntervalMs;

    return this.nextDamage();
  }

  private nextDamage(): CouchDamageEvent | undefined {
    if (this.damage >= this.config.maxDamage) return;
    this.damage++;

    return chaosEvent(this.objectId, 'scratch', this.damage, this.config.damageValue);
  }

  snapshot() {
    return { state: this.phase, damage: this.damage };
  }

  reset() {
    this.phase = 'idle';
    this.waited = 0;
    this.sinceDamage = 0;
    this.damage = 0;
  }
}
