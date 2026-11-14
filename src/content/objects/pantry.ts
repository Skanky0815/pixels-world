import type { ObjectDefinition } from '../../game/content/definitions.ts';
import type { DamageAlbumEntry } from '../album/discovery.ts';
type PantryDefinition = Extract<ObjectDefinition, { kind: 'pantry' }> & {
  readonly album: DamageAlbumEntry;
};
const base = {
  kind: 'pantry',
  asset: 'pantry',
  capabilities: ['push', 'damage'],
  spawn: { size: 'medium', category: 'decoration', random: true, support: 'any-surface' },
  color: 0xdabf89,
} as const;

export const PANTRY = {
  'pasta-jar': {
    ...base,
    appearance: 'jar',
    points: 24,
    album: {
      id: 'pantry.jar',
      asset: 'pantry-jar',
      rooms: ['kitchen'],
      condition: { kind: 'break', stage: 1 },
      name: { de: 'Das Nudelglas', en: 'The pasta jar' },
      fluff: {
        de: 'Vorratshaltung. Jetzt mit sehr freier Flächenaufteilung.',
        en: 'Pantry storage. Now with a very open layout.',
      },
      sara: {
        de: 'Die Nudeln waren im Glas besser aufgehoben, Pixel.',
        en: 'The pasta was better off inside the jar, Pixel.',
      },
    },
  },
  'biscuit-tin': {
    ...base,
    appearance: 'tin',
    spawn: { ...base.spawn, size: 'small' },
    points: 16,
    album: {
      id: 'pantry.tin',
      asset: 'pantry-tin',
      rooms: ['kitchen'],
      condition: { kind: 'spill', stage: 1 },
      name: { de: 'Die Keksdose', en: 'The biscuit tin' },
      fluff: {
        de: 'Ein Herz auf der Dose. Ein ganzer Ausflug für die Kekse.',
        en: 'A heart on the tin. A whole adventure for the biscuits.',
      },
      sara: {
        de: 'Du hast die Keksdose gefunden. Den Deckel offenbar auch.',
        en: 'You found the biscuit tin. And apparently its lid, too.',
      },
    },
  },
} as const satisfies Readonly<Record<string, PantryDefinition>>;
export const PANTRY_VARIANTS = Object.keys(PANTRY);
