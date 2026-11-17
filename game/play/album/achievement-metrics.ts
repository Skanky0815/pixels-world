import type { AchievementDefinition } from '../content/achievements.ts';

type TargetCollection = readonly string[] | ReadonlySet<string>;
/** Confirmed progress, either as a stored snapshot or the live domain sets. */
export interface AchievementMetricData {
  readonly reconciliations: number;
  readonly ruined: TargetCollection;
  readonly ruinedVariants?: TargetCollection;
  readonly completedRooms?: TargetCollection;
  readonly unlocked: TargetCollection;
}

function asSet(targets: TargetCollection): ReadonlySet<string> {
  return 'has' in targets ? targets : new Set(targets);
}

export function achievementTargets(
  metric: AchievementDefinition['metric'],
  data: AchievementMetricData,
): ReadonlySet<string> {
  if (metric === 'all') return asSet(data.unlocked);

  if (metric === 'rooms') return asSet(data.completedRooms ?? []);

  return asSet(metric === 'variants' ? (data.ruinedVariants ?? []) : data.ruined);
}

/** Raw metric only: thresholds, display caps and awarding remain with the caller. */
export function achievementValue(entry: AchievementDefinition, data: AchievementMetricData) {
  if (!entry.targets)
    return entry.metric === 'reconciliations' ? data.reconciliations : asSet(data.ruined).size;

  const found = achievementTargets(entry.metric, data);

  return entry.targets.filter((id) => found.has(id)).length;
}
