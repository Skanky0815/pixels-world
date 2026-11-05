import { assertObjectId, chaosEvent, type ChaosEvent } from '../domain/chaos-event.ts';

export const CURTAIN_SLIDE = {
  climbSpeed: 125,
  slideSpeed: 35,
  descendSpeed: 125,
  damageIntervalMs: 600,
  maxDamage: 8,
  damageValue: 4,
} as const;

export type CurtainState = 'detached' | 'climbing' | 'sliding';
export type CurtainDamageEvent = ChaosEvent<'tear'>;
export interface TearConfig {
  readonly damageIntervalMs: number;
  readonly maxDamage: number;
  readonly damageValue: number;
}

/** Damage follows actual descent; climbing, support and detaching interrupt its timer. */
export class CurtainSliding {
  private phase: CurtainState = 'detached';
  private elapsed = 0;
  private damage = 0;
  private readonly objectId: string;
  private readonly config: TearConfig;

  // eslint-disable-next-line max-lines-per-function, complexity -- Die zusammenhängende Validierung des Vorhang-Konfigurationsvertrags bleibt an einer Stelle.
  constructor(config: TearConfig = CURTAIN_SLIDE, objectId = 'curtain') {
    assertObjectId(objectId);
    this.objectId = objectId;

    if (
      !Number.isFinite(config.damageIntervalMs) ||
      config.damageIntervalMs <= 0 ||
      !Number.isSafeInteger(config.maxDamage) ||
      config.maxDamage <= 0 ||
      !Number.isSafeInteger(config.damageValue) ||
      config.damageValue < 0
    )
      throw new Error('Invalid curtain configuration');
    this.config = { ...config };
  }

  // eslint-disable-next-line max-lines-per-function -- Die typisierte Signatur und die kurze Folge aus Zustandswechsel, Zeitreset und Schadensschritt bleiben gemeinsam sichtbar.
  update(
    deltaMs: number,
    state: CurtainState,
    descending: boolean,
  ): CurtainDamageEvent | undefined {
    if (this.phase !== state) this.elapsed = 0;
    this.phase = state;

    if (state !== 'sliding') this.elapsed = 0;

    if (state !== 'sliding' || !descending) return;

    return this.advanceDamage(deltaMs);
  }

  private advanceDamage(deltaMs: number): CurtainDamageEvent | undefined {
    this.elapsed += Number.isFinite(deltaMs) ? Math.max(0, deltaMs) : 0;

    if (this.elapsed < this.config.damageIntervalMs) return;
    // Never emit a backlog of damage events after a delayed frame.
    this.elapsed %= this.config.damageIntervalMs;

    if (this.damage >= this.config.maxDamage) return;
    this.damage++;

    return chaosEvent(this.objectId, 'tear', this.damage, this.config.damageValue);
  }

  snapshot() {
    return { state: this.phase, damage: this.damage };
  }

  reset() {
    this.phase = 'detached';
    this.elapsed = 0;
    this.damage = 0;
  }
}
