import { standingStill, type Bounds, type InteractionContext } from './contracts.ts';
import { assertObjectId, chaosEvent } from '../domain/chaos-event.ts';
export const CARPET_RULES = { delayMs: 2500, retchMs: 1400, points: 15 } as const;
export interface CarpetRules {
  readonly delayMs: number;
  readonly retchMs: number;
  readonly points: number;
}
export function validateCarpetRules(rules: CarpetRules) {
  if (
    ![rules.delayMs, rules.retchMs].every((v) => Number.isFinite(v) && v > 0) ||
    !Number.isSafeInteger(rules.points) ||
    rules.points < 0
  )
    throw new Error('Invalid carpet rules');
}

/** Only uninterrupted eligible time can complete the action; the mark is permanent until reset. */
export class CarpetHairball {
  private state: 'idle' | 'waiting' | 'retching' | 'soiled' = 'idle';
  private elapsed = 0;
  private readonly id: string;
  private readonly rules: CarpetRules;
  constructor(id: string, rules: CarpetRules = CARPET_RULES) {
    assertObjectId(id);
    validateCarpetRules(rules);
    this.id = id;
    this.rules = { ...rules };
  }

  update(delta: number, eligible: boolean) {
    if (this.state === 'soiled') return;

    if (!eligible) {
      this.reset();

      return;
    }

    if (this.state === 'idle') this.state = 'waiting';
    this.elapsed += Number.isFinite(delta) ? Math.max(0, delta) : 0;

    return this.advance();
  }

  private advance() {
    if (this.state === 'waiting' && this.elapsed >= this.rules.delayMs) {
      this.elapsed -= this.rules.delayMs;
      this.state = 'retching';
    }

    if (this.state === 'retching' && this.elapsed >= this.rules.retchMs) return this.finish();
  }

  private finish() {
    this.state = 'soiled';
    this.elapsed = 0;

    return chaosEvent(this.id, 'hairball', 1, this.rules.points);
  }

  snapshot() {
    return {
      state: this.state,
      progress:
        this.state === 'soiled'
          ? 1
          : this.elapsed / (this.state === 'retching' ? this.rules.retchMs : this.rules.delayMs),
    };
  }

  reset() {
    this.state = 'idle';
    this.elapsed = 0;
  }
}

export function carpetEligible(context: InteractionContext, area: Bounds, floorY: number) {
  return (
    standingStill(context) &&
    Math.abs(context.pixel.bottom - floorY) < 2 &&
    context.pixel.x >= area.x &&
    context.pixel.x <= area.x + area.width
  );
}
