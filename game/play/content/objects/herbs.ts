import type { DamageAlbumEntry } from '../album/discovery.ts';
import { PLANT_NIBBLE } from '../../interactions/plant-nibbling.ts';
import type { PlantAppearance } from '../../assets/plant-appearance.ts';
import type { ObjectDefinition } from '../definitions.ts';

type Herb = Exclude<PlantAppearance, 'catgrass'>;
const names = {
  basil: { de: 'Basilikum', en: 'Basil' },
  parsley: { de: 'Petersilie', en: 'Parsley' },
  mint: { de: 'Minze', en: 'Mint' },
};
const quotes = {
  basil: {
    de: 'Pixel, das war fürs Abendessen. Für meines.',
    en: 'Pixel, that was for dinner. Mine.',
  },
  parsley: {
    de: 'Die Petersilie war schon klein genug, Pixel.',
    en: 'The parsley was small enough already, Pixel.',
  },
  mint: {
    de: 'Ein Kräutergarten ist kein Katzenbuffet.',
    en: 'A herb garden is not a cat buffet.',
  },
};

// eslint-disable-next-line max-lines-per-function -- Jede echte Variante erhält denselben vollständigen Pflanzen-, Spawn- und Albumvertrag.
function herb(
  appearance: Herb,
): Extract<ObjectDefinition, { kind: 'plant' }> & { readonly album: DamageAlbumEntry } {
  return {
    kind: 'plant',
    asset: 'catgrass-default',
    appearance,
    capabilities: ['automatic', 'damage'],
    spawn: { size: 'medium', category: 'plant', random: true, support: 'any-surface' },
    reach: { left: -38, right: 22 },
    rules: PLANT_NIBBLE,
    album: {
      id: `plant.${appearance}`,
      asset: `herb-${appearance}`,
      rooms: ['kitchen'],
      name: names[appearance],
      condition: { kind: 'nibble', stage: 1 },
      also: [{ kind: 'tip', stage: 2 }],
      fluff: {
        de: 'Frisch geerntet. Sehr eigenwillig portioniert.',
        en: 'Freshly harvested. Very creatively portioned.',
      },
      sara: quotes[appearance],
    },
  };
}

export const HERBS = {
  'kitchen-basil': herb('basil'),
  'kitchen-parsley': herb('parsley'),
  'kitchen-mint': herb('mint'),
} as const;
export const HERB_VARIANTS = Object.keys(HERBS);
