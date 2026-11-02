export const VASES = [
  { id: 'small-vase', x: 620, shelfY: 304, points: 25, color: 0xc5875f },
  { id: 'blue-vase', x: 710, shelfY: 224, points: 35, color: 0x638c97 },
  { id: 'heirloom-vase', x: 906, shelfY: 154, points: 40, color: 0xc5ae70 },
] as const;

export const ANGER_LEVELS = [
  { min: 0, id: 'calm', label: 'Entspannt', color: 0x718463 },
  { min: 25, id: 'annoyed', label: 'Genervt', color: 0xc49464 },
  { min: 60, id: 'angry', label: 'Wütend', color: 0xb65d4a },
] as const;

export function angerFor(score: number) {
  return [...ANGER_LEVELS].reverse().find(level => score >= level.min) ?? ANGER_LEVELS[0];
}

/** Award each damage event once; count distinct damaged objects separately. */
export class ChaosScore {
  private total = 0;
  private readonly damaged = new Set<string>();
  private readonly objects = new Set<string>();

  get score() { return this.total; }
  get count() { return this.objects.size; }

  award(id: string, points: number, objectId = id): boolean {
    if (!Number.isSafeInteger(points) || points < 0) throw new Error('Invalid damage value');
    if (this.damaged.has(id)) return false;
    this.damaged.add(id);
    this.objects.add(objectId);
    this.total += points;
    return true;
  }

  reset() {
    this.total = 0;
    this.damaged.clear();
    this.objects.clear();
  }
}
