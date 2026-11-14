import type { ObjectDefinition } from '../../game/content/definitions.ts';
import { TABLECLOTH_RULES } from '../../game/interactions/tablecloth-pulling.ts';
export const TABLECLOTHS = {
  'warm-tablecloth': {
    kind: 'tablecloth',
    asset: 'tablecloth',
    capabilities: ['automatic', 'damage'],
    geometry: { width: 220, hang: 100 },
    rules: TABLECLOTH_RULES,
    spawn: { size: 'large', category: 'furniture', random: false, reason: 'room-fixture' },
    album: {
      id: 'tablecloth.warm',
      asset: 'tablecloth-pile',
      rooms: ['kitchen'],
      condition: { kind: 'spill', stage: 1 },
      name: { de: 'Die Tischdecke', en: 'The tablecloth' },
      fluff: {
        de: 'Ein kurzer Zug. Ein sehr leerer Tisch.',
        en: 'One little tug. One very empty table.',
      },
      sara: {
        de: 'Abräumen geht auch ohne Schwerkraft, Pixel.',
        en: 'You can clear the table without gravity, Pixel.',
      },
    },
  },
} as const satisfies Readonly<Record<string, ObjectDefinition>>;
