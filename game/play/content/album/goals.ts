import type { GoalAlbumEntry } from './discovery.ts';

/** Peaceful goal discoveries are never destruction or chaos events. */
export const GOAL_ALBUM = {
  'food-bowl': {
    id: 'goal.food-bowl',
    asset: 'food-bowl',
    rooms: ['kitchen'],
    name: { de: 'Pixels Futternapf', en: 'Pixel’s food bowl' },
    condition: { kind: 'goal-reached', stage: 1 },
    fluff: {
      de: 'Ein voller Napf. Endlich ein vernünftiger Grund für diese Kletterei.',
      en: 'A full bowl. Finally, a sensible reason for all that climbing.',
    },
    sara: {
      de: 'Na siehst du, Pixel. Dafür durfte die Küche sogar heil bleiben.',
      en: 'See, Pixel? You could even leave the kitchen in one piece for that.',
    },
  },
} as const satisfies Readonly<Record<string, GoalAlbumEntry>>;
