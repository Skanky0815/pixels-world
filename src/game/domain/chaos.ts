import { copy } from '../../i18n/locale.ts';
import type { ChaosEvent } from './chaos-event.ts';
export const ANGER_LEVELS = [
  { min: 0, id: 'calm', label: copy('relaxed'), color: 0x718463 },
  { min: 25, id: 'annoyed', label: copy('annoyed'), color: 0xc49464 },
  { min: 60, id: 'angry', label: copy('angry'), color: 0xb65d4a },
] as const;
export function angerFor(score: number) {
  return [...ANGER_LEVELS].reverse().find((level) => score >= level.min) ?? ANGER_LEVELS[0];
}

/** Award each damage event once; count distinct damaged objects separately. */
export class ChaosScore {
  private total = 0;
  private readonly damaged = new Set<string>();
  private readonly objects = new Set<string>();
  get score() {
    return this.total;
  }

  get count() {
    return this.objects.size;
  }

  award(id: string, points: number, objectId = id): boolean {
    if (!Number.isSafeInteger(points) || points < 0) throw new Error('Invalid damage value');

    if (this.damaged.has(id)) return false;
    this.damaged.add(id);
    this.objects.add(objectId);
    this.total += points;

    return true;
  }

  awardEvent(event: ChaosEvent) {
    return this.award(event.id, event.value, event.objectId);
  }

  reset() {
    this.total = 0;
    this.damaged.clear();
    this.objects.clear();
  }
}
