export type DamageKind =
  'scratch' | 'tear' | 'nibble' | 'tip' | 'break' | 'shelf-damage' | 'collapse' | 'topple';
export interface ChaosEvent<K extends DamageKind = DamageKind, S extends number = number> {
  readonly id: string;
  readonly objectId: string;
  readonly kind: K;
  readonly stage: S;
  readonly value: number;
}

export function assertObjectId(id: string) {
  if (typeof id !== 'string' || !id.trim()) throw new Error('Invalid object ID');
}

/** Tuple encoding cannot collide when IDs themselves contain separators. */
// eslint-disable-next-line max-lines-per-function -- Validierung und eingefrorener Ereignisvertrag bleiben atomar; die ausgeschriebenen Felder dokumentieren die Grenze.
export function chaosEvent<K extends DamageKind, S extends number>(
  objectId: string,
  kind: K,
  stage: S,
  value: number,
): ChaosEvent<K, S> {
  assertObjectId(objectId);

  if (!Number.isSafeInteger(stage) || stage < 1 || !Number.isSafeInteger(value) || value < 0)
    throw new Error('Invalid damage event');

  return Object.freeze({
    id: JSON.stringify([objectId, kind, stage]),
    objectId,
    kind,
    stage,
    value,
  });
}

/** Composed by object adapters; independent of Phaser and score calculation. */
export class DamageHistory {
  private events = 0;
  private lastDamage: ChaosEvent | null = null;

  record(event: ChaosEvent) {
    this.events++;
    this.lastDamage = event;
  }

  snapshot() {
    return {
      damage: this.lastDamage?.stage ?? 0,
      events: this.events,
      lastDamage: this.lastDamage,
    };
  }

  reset() {
    this.events = 0;
    this.lastDamage = null;
  }
}
