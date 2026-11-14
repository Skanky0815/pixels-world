import { DESTRUCTION_VARIANTS } from '../../content/achievement-categories.ts';
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
  readonly unlocked: readonly string[];
}
export const EMPTY_ACHIEVEMENTS: AchievementData = Object.freeze({
  reconciliations: 0,
  ruined: Object.freeze([]),
  ruinedVariants: Object.freeze([]),
  unlocked: Object.freeze([]),
});

/** Persisted baseline plus unsaved rounds; restoring preferences never counts a round twice. */
export class AchievementProgress {
  private baseline = 0;
  private pending = 0;
  private readonly ruined = new Set<string>();
  private readonly ruinedVariants = new Set<string>();
  private readonly unlocked = new Set<string>();

  restore(data: AchievementData) {
    this.baseline = Math.max(this.baseline, data.reconciliations);

    for (const target of DESTRUCTION_TARGETS)
      if (data.ruined.includes(target.id)) this.ruined.add(target.id);

    for (const entry of ACHIEVEMENTS)
      if (data.unlocked.includes(entry.id)) this.unlocked.add(entry.id);

    this.addVariants(data.ruinedVariants ?? []);
    this.earn();
  }

  // eslint-disable-next-line max-lines-per-function -- Bestätigte Runden erhöhen Zähler und beide deduplizierten Zielsammlungen gemeinsam.
  confirm(
    reconciled: boolean,
    targets: Iterable<DestructionTarget>,
    variants: Iterable<string> = [],
  ) {
    if (!reconciled) return Object.freeze([]);

    if (this.total() < Number.MAX_SAFE_INTEGER) this.pending++;

    for (const id of targets)
      if (DESTRUCTION_TARGETS.some((target) => target.id === id)) this.ruined.add(id);

    for (const id of variants) if (DESTRUCTION_VARIANTS.includes(id)) this.ruinedVariants.add(id);

    return this.earn();
  }

  private addVariants(variants: Iterable<string>) {
    for (const id of variants) if (DESTRUCTION_VARIANTS.includes(id)) this.ruinedVariants.add(id);
  }

  private earn() {
    const earned = ACHIEVEMENTS.filter(
      (entry) => !this.unlocked.has(entry.id) && this.value(entry) >= entry.threshold,
    ).map((entry) => entry.id);

    for (const id of earned) this.unlocked.add(id);

    return Object.freeze(earned);
  }

  private total() {
    return Math.min(Number.MAX_SAFE_INTEGER, this.baseline + this.pending);
  }

  private value(entry: AchievementDefinition) {
    if (entry.metric === 'variants')
      return entry.targets?.filter((id) => this.ruinedVariants.has(id)).length ?? 0;

    return entry.metric === 'reconciliations' ? this.total() : this.ruined.size;
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
    this.unlocked.clear();
  }

  snapshot(): AchievementData {
    return Object.freeze({
      reconciliations: this.total(),
      ruined: Object.freeze([...this.ruined]),
      ruinedVariants: Object.freeze([...this.ruinedVariants]),
      unlocked: Object.freeze([...this.unlocked]),
    });
  }
}
