import type { ObjectDefinition } from '../../game/content/definitions.ts';
import { TRASH_BIN_RULES } from '../../game/assets/trash-bin-profile.ts';
export const TRASH_BINS = {
  'cream-trash-bin': {
    kind: 'trash-bin',
    asset: 'trash-bin',
    capabilities: ['automatic', 'damage'],
    spawn: { size: 'medium', category: 'furniture', random: true, support: 'floor' },
    rules: TRASH_BIN_RULES,
    album: {
      id: 'trash-bin.cream',
      asset: 'trash-bin-intact',
      rooms: ['kitchen'],
      condition: { kind: 'spill', stage: 1 },
      name: { de: 'Der Mülleimer', en: 'The rubbish bin' },
      fluff: {
        de: 'Alles im Eimer. Bis Pixel kam.',
        en: 'Everything in the bin. Until Pixel arrived.',
      },
      sara: {
        de: 'Das Rascheln ist keine Einladung, Pixel.',
        en: 'The rustling is not an invitation, Pixel.',
      },
    },
  },
} as const satisfies Readonly<Record<string, ObjectDefinition>>;
