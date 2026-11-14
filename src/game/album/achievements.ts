import {
  ACHIEVEMENTS,
  DESTRUCTION_TARGETS,
  type DestructionTarget,
} from '../../content/achievements.ts';
export interface AchievementData {
  readonly reconciliations: number;
  readonly ruined: readonly string[];
  readonly unlocked: readonly string[];
}
export const EMPTY_ACHIEVEMENTS: AchievementData = Object.freeze({
  reconciliations: 0,
  ruined: Object.freeze([]),
  unlocked: Object.freeze([]),
});

/** Persisted baseline plus unsaved rounds; restoring preferences never counts a round twice. */
export class AchievementProgress {
  private baseline = 0;
  private pending = 0;
  private readonly ruined = new Set<string>();
  private readonly unlocked = new Set<string>();

  restore(data: AchievementData) {
    this.baseline = Math.max(this.baseline, data.reconciliations);

    for (const target of DESTRUCTION_TARGETS)
      if (data.ruined.includes(target.id)) this.ruined.add(target.id);

    for (const entry of ACHIEVEMENTS)
      if (data.unlocked.includes(entry.id)) this.unlocked.add(entry.id);
    this.earn();
  }

  confirm(reconciled: boolean, targets: Iterable<DestructionTarget>) {
    if (!reconciled) return Object.freeze([]);

    if (this.total() < Number.MAX_SAFE_INTEGER) this.pending++;

    for (const id of targets)
      if (DESTRUCTION_TARGETS.some((target) => target.id === id)) this.ruined.add(id);

    return this.earn();
  }

  private earn() {
    const earned = ACHIEVEMENTS.filter(
      (entry) => !this.unlocked.has(entry.id) && this.value(entry.metric) >= entry.threshold,
    ).map((entry) => entry.id);

    for (const id of earned) this.unlocked.add(id);

    return Object.freeze(earned);
  }

  private total() {
    return Math.min(Number.MAX_SAFE_INTEGER, this.baseline + this.pending);
  }

  private value(metric: 'reconciliations' | 'destruction') {
    return metric === 'reconciliations' ? this.total() : this.ruined.size;
  }

  markSaved() {
    this.baseline = this.total();
    this.pending = 0;
  }

  reset() {
    this.baseline = 0;
    this.pending = 0;
    this.ruined.clear();
    this.unlocked.clear();
  }

  snapshot(): AchievementData {
    return Object.freeze({
      reconciliations: this.total(),
      ruined: Object.freeze([...this.ruined]),
      unlocked: Object.freeze([...this.unlocked]),
    });
  }
}
