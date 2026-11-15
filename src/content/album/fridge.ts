import type { DamageAlbumEntry } from './discovery.ts';

export const FRIDGE_ALBUM = {
  'cream-fridge': {
    id: 'fridge.cream',
    asset: 'fridge-open',
    rooms: ['kitchen'],
    condition: { kind: 'spill', stage: 1 },
    name: { de: 'Der Kühlschrank', en: 'The refrigerator' },
    fluff: {
      de: 'Die Kühlkette hält. Die Ordnung nicht.',
      en: 'The cold chain holds. The tidy shelves do not.',
    },
    sara: {
      de: 'Pixel. Ich hatte die Lebensmittel schon sortiert.',
      en: 'Pixel. I had already sorted the groceries.',
    },
  },
} as const satisfies Readonly<Record<string, DamageAlbumEntry>>;
