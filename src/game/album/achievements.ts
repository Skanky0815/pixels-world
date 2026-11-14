import { DESTRUCTION_VARIANTS } from '../../content/achievement-categories.ts';
import { ROOM_COMPLETIONS } from '../../content/achievement-rooms.ts';
import {
  ACHIEVEMENTS,
  DESTRUCTION_TARGETS,
  type DestructionTarget,
  type AchievementDefinition,
} from '../../content/achievements.ts';
export interface AchievementData {
  readonly reconciliations: number;
  readonly ruined: readonly string[];
  readonly ruinedVariants?: readonly string[];
  readonly completedRooms?: readonly string[];
  readonly unlocked: readonly string[];
}
export const EMPTY_ACHIEVEMENTS: AchievementData = Object.freeze({
  reconciliations: 0,
  ruined: Object.freeze([]),
  ruinedVariants: Object.freeze([]),
  completedRooms: Object.freeze([]),
  unlocked: Object.freeze([]),
});

/** Persisted baseline plus unsaved rounds; restoring preferences never counts a round twice. */
export class AchievementProgress {
  private baseline = 0;
  private pending = 0;
  private readonly ruined = new Set<string>();
  private readonly ruinedVariants = new Set<string>();
  private readonly completedRooms = new Set<string>();
  private readonly unlocked = new Set<string>();

  restore(data: AchievementData) {
    this.baseline = Math.max(this.baseline, data.reconciliations);

    for (const target of DESTRUCTION_TARGETS)
      if (data.ruined.includes(target.id)) this.ruined.add(target.id);

    for (const entry of ACHIEVEMENTS)
      if (data.unlocked.includes(entry.id)) this.unlocked.add(entry.id);

    this.addVariants(data.ruinedVariants ?? []);
    this.addRooms(data.completedRooms ?? []);
    this.earn();
  }

  // eslint-disable-next-line max-lines-per-function -- Bestätigte Runden erhöhen Zähler und beide deduplizierten Zielsammlungen gemeinsam.
  confirm(
    reconciled: boolean,
    targets: Iterable<DestructionTarget>,
    variants: Iterable<string> = [],
    rooms: Iterable<string> = [],
  ) {
    this.addRooms(rooms);

    if (!reconciled) return this.earn();

    if (this.total() < Number.MAX_SAFE_INTEGER) this.pending++;

    for (const id of targets)
      if (DESTRUCTION_TARGETS.some((target) => target.id === id)) this.ruined.add(id);

    this.addVariants(variants);

    return this.earn();
  }

  private addVariants(variants: Iterable<string>) {
    for (const id of variants) if (DESTRUCTION_VARIANTS.includes(id)) this.ruinedVariants.add(id);
  }

  private addRooms(rooms: Iterable<string>) {
    for (const id of rooms) if (ROOM_COMPLETIONS.includes(id)) this.completedRooms.add(id);
  }

  private earn() {
    const earned: string[] = [];

    for (const entry of ACHIEVEMENTS) {
      if (this.unlocked.has(entry.id) || this.value(entry) < entry.threshold) continue;
      this.unlocked.add(entry.id);
      earned.push(entry.id);
    }

    return Object.freeze(earned);
  }

  private total() {
    return Math.min(Number.MAX_SAFE_INTEGER, this.baseline + this.pending);
  }

  private value(entry: AchievementDefinition) {
    if (entry.targets)
      return entry.targets.filter((id) => this.targetSet(entry.metric).has(id)).length;

    return entry.metric === 'reconciliations' ? this.total() : this.ruined.size;
  }

  private targetSet(metric: AchievementDefinition['metric']) {
    if (metric === 'all') return this.unlocked;

    return metric === 'rooms' ? this.completedRooms : this.ruinedVariants;
  }

  markSaved() {
    this.baseline = this.total();
    this.pending = 0;
  }

  reset() {
    this.baseline = 0;
    this.pending = 0;
    this.ruined.clear();
    this.ruinedVariants.clear();
    this.completedRooms.clear();
    this.unlocked.clear();
  }

  snapshot(): AchievementData {
    return Object.freeze({
      reconciliations: this.total(),
      ruined: Object.freeze([...this.ruined]),
      ruinedVariants: Object.freeze([...this.ruinedVariants]),
      completedRooms: Object.freeze([...this.completedRooms]),
      unlocked: Object.freeze([...this.unlocked]),
    });
  }
}
