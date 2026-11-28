import { ACHIEVEMENTS } from '../content/achievements.ts';
import type { AchievementData } from '../album/achievements.ts';

export const ACHIEVEMENT_FILTERS = ['all', 'open', 'completed'] as const;
export type AchievementFilter = (typeof ACHIEVEMENT_FILTERS)[number];

/** Presentation only: filtering never changes stored progress or unlocks. */
export function filteredAchievements(data: AchievementData, filter: AchievementFilter) {
  return ACHIEVEMENTS.filter((entry) => {
    const completed = data.unlocked.includes(entry.id);

    return filter === 'all' || (filter === 'completed' ? completed : !completed);
  });
}
