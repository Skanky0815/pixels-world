import type { TextKey } from '../i18n/locale.ts';

export const PEACEFUL_GOAL_LINES = [
  'peacefulGoalBall',
  'peacefulGoalProud',
  'peacefulGoalWelcome',
  'peacefulGoalHeart',
  'peacefulGoalTogether',
] as const satisfies readonly TextKey[];
export type PeacefulGoalLine = (typeof PEACEFUL_GOAL_LINES)[number];
