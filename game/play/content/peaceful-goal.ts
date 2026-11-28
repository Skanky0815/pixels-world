import type { TextKey } from '../../shared/i18n/locale.ts';

export const PEACEFUL_GOAL_LINES = [
  'peacefulGoalBall',
  'peacefulGoalProud',
  'peacefulGoalWelcome',
  'peacefulGoalHeart',
  'peacefulGoalTogether',
] as const satisfies readonly TextKey[];
export const PEACEFUL_FOOD_LINES = [
  'peacefulGoalFood',
  'peacefulGoalProud',
  'peacefulGoalWelcome',
  'peacefulGoalHeart',
  'peacefulGoalTogether',
] as const satisfies readonly TextKey[];
export const PEACEFUL_REST_LINES = [
  'peacefulGoalRest',
  'peacefulGoalProud',
  'peacefulGoalHeart',
] as const satisfies readonly TextKey[];
export type PeacefulGoalLine =
  | (typeof PEACEFUL_REST_LINES)[number]
  | (typeof PEACEFUL_GOAL_LINES)[number]
  | (typeof PEACEFUL_FOOD_LINES)[number];
