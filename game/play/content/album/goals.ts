import type { GoalAlbumEntry } from './discovery.ts';

/** Peaceful goal discoveries are never destruction or chaos events. */
export const GOAL_ALBUM = {
  'sleep-pad': {
    id: 'goal.sleep-pad',
    asset: 'sleep-pad',
    rooms: ['bedroom'],
    name: { de: 'Pixels Katzenbett', en: 'Pixel’s cat bed' },
    condition: { kind: 'goal-reached', stage: 1 },
    fluff: {
      de: 'Das kleine Bett unterm großen Bett. Gemütlicher wird es nicht.',
      en: 'The little bed underneath the big bed. As cozy as it gets.',
    },
    sara: {
      de: 'Den Platz mache ich dir nicht streitig, Pixel.',
      en: 'I will not compete for that spot, Pixel.',
    },
  },
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
