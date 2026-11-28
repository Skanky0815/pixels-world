import type { ObjectCatalog } from '../definitions.ts';
import { LAUNDRY_RULES } from '../../interactions/laundry.ts';

const laundry = {
  kind: 'laundry',
  asset: 'laundry',
  capabilities: ['automatic', 'damage'],
  spawn: { size: 'medium', category: 'furniture', random: false, reason: 'room-fixture' },
  rules: LAUNDRY_RULES,
} as const;

export const LAUNDRY = {
  'folded-laundry': {
    ...laundry,
    appearance: 'pile',
    album: {
      id: 'laundry.pile',
      asset: 'laundry-pile',
      rooms: ['bedroom'],
      name: { de: 'Der frische Wäscheberg', en: 'The fresh laundry pile' },
      condition: { kind: 'spill', stage: 1 },
      fluff: {
        de: 'Frisch gefaltet. Von Pixel neu interpretiert.',
        en: 'Freshly folded. Reinterpreted by Pixel.',
      },
      sara: {
        de: 'Pixel, das war schon fertig gefaltet.',
        en: 'Pixel, I had already folded that.',
      },
    },
  },
  'laundry-basket': {
    ...laundry,
    appearance: 'basket',
    album: {
      id: 'laundry.basket',
      asset: 'laundry-basket',
      rooms: ['bedroom'],
      name: { de: 'Der Wäschekorb', en: 'The laundry basket' },
      condition: { kind: 'spill', stage: 1 },
      fluff: {
        de: 'Ein Transportmittel. Offenbar für Katzen.',
        en: 'A means of transport. Apparently for cats.',
      },
      sara: {
        de: 'Der Korb hatte vorher einen festen Parkplatz.',
        en: 'The basket used to have a fixed parking spot.',
      },
    },
  },
} as const satisfies ObjectCatalog;
