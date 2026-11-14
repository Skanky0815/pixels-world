import { ACHIEVEMENT_CATEGORIES, ACHIEVEMENT_CATEGORIES_V2 } from './achievement-categories.ts';
import { ROOM_ACHIEVEMENTS_V1, ROOM_ACHIEVEMENTS_V2 } from './achievement-rooms.ts';
import type { ChaosEvent } from '../game/domain/chaos-event.ts';

type Localized = { readonly de: string; readonly en: string };
export interface AchievementDefinition {
  readonly id: string;
  readonly name: Localized;
  readonly description: Localized;
  readonly quote: Localized;
  readonly metric: 'reconciliations' | 'destruction' | 'variants' | 'rooms' | 'all';
  readonly targets?: readonly string[];
  readonly threshold: number;
  readonly art: 'love' | 'chaos';
}

/** Version-one objective set: additions to the world never move this goal. */
export const DESTRUCTION_TARGETS_V1 = [
  {
    id: 'vase',
    object: 'vase',
    event: 'break',
    stage: 1,
    name: { de: 'Vase zerbrochen', en: 'Vase broken' },
  },
  {
    id: 'couch',
    object: 'couch',
    event: 'scratch',
    stage: 6,
    name: { de: 'Sofa vollständig zerkratzt', en: 'Couch fully scratched' },
  },
  {
    id: 'curtain',
    object: 'curtain',
    event: 'tear',
    stage: 8,
    name: { de: 'Vorhang vollständig zerrissen', en: 'Curtain fully torn' },
  },
  {
    id: 'plant',
    object: 'plant',
    event: 'tip',
    stage: 2,
    name: { de: 'Katzengras umgekippt', en: 'Cat grass tipped over' },
  },
  {
    id: 'books',
    object: 'books',
    event: 'topple',
    stage: 1,
    name: { de: 'Bücher heruntergeworfen', en: 'Books knocked down' },
  },
  {
    id: 'picture',
    object: 'picture',
    event: 'picture-fall',
    stage: 1,
    name: { de: 'Bild heruntergeworfen', en: 'Picture knocked down' },
  },
  {
    id: 'shelf',
    object: 'shelf',
    event: 'collapse',
    stage: 2,
    name: { de: 'Regal eingestürzt', en: 'Shelf collapsed' },
  },
] as const;
export const DESTRUCTION_TARGETS = [
  ...DESTRUCTION_TARGETS_V1,
  {
    id: 'food-bag',
    object: 'food-bag',
    event: 'spill',
    stage: 1,
    name: { de: 'Futterbeutel ausgelaufen', en: 'Food bag spilled' },
  },
  {
    id: 'dish',
    object: 'dish',
    event: 'break',
    stage: 1,
    name: { de: 'Geschirr zerbrochen', en: 'Crockery broken' },
  },
] as const;
export type DestructionTarget = (typeof DESTRUCTION_TARGETS)[number]['id'];

export function destructionTarget(event: ChaosEvent, object?: string) {
  return DESTRUCTION_TARGETS.find(
    (target) =>
      target.object === object && target.event === event.kind && event.stage >= target.stage,
  )?.id;
}

// eslint-disable-next-line max-lines-per-function -- Die kleine Inhaltsfabrik hält Titel, Beschreibung und Schwelle einer Stufe gemeinsam.
const angel = (threshold: number, tier: string, de: string, en: string): AchievementDefinition => ({
  id: `achievement.angel-${threshold}`,
  name: { de: `Unschuldsengel ${tier}`, en: `Little angel ${tier}` },
  description: {
    de: `${threshold} erfolgreiche Versöhnungen mit Sara.`,
    en: `${threshold} successful reconciliations with Sara.`,
  },
  quote: { de, en },
  metric: 'reconciliations',
  threshold,
  art: 'love',
});

// eslint-disable-next-line max-lines-per-function -- Eine Kategorie bündelt ihren stabilen Zielkatalog mit den lokalisierten Metadaten.
const categories: readonly AchievementDefinition[] = ACHIEVEMENT_CATEGORIES.map((category) => ({
  id: `achievement.category-${category.id}-v1`,
  name: category.name,
  description: {
    de: 'Alle Varianten dieser Kategorie vollständig ruinieren – über mehrere erfolgreich versöhnte Runden.',
    en: 'Fully ruin every variant in this category across successfully reconciled rounds.',
  },
  quote: { de: 'Das nenne ich konsequent, Pixel.', en: 'That is what I call commitment, Pixel.' },
  metric: 'variants',
  threshold: category.targets.length,
  targets: category.targets,
  art: 'chaos',
}));

const MILESTONES: readonly AchievementDefinition[] = [
  angel(
    1,
    'I',
    'Einmal lieb schauen. Schon wieder davongekommen.',
    'One sweet look. Got away with it again.',
  ),
  angel(
    10,
    'II',
    'Langsam erkenne ich ein Muster, Pixel.',
    'I am starting to see a pattern, Pixel.',
  ),
  angel(
    50,
    'III',
    'Dein Blick sollte einen Warnhinweis haben.',
    'That look of yours needs a warning label.',
  ),
  angel(
    100,
    'IV',
    'Hundertmal. Und ich falle immer noch darauf rein.',
    'A hundred times. And I still fall for it.',
  ),
  ...categories,
  {
    id: 'achievement.destruction-v1',
    name: { de: 'Meister der Zerstörung', en: 'Master of destruction' },
    description: {
      de: 'Jede Objektart einmal vollständig ruinieren. Über mehrere erfolgreich versöhnte Runden.',
      en: 'Fully ruin each of the seven object types, across successfully reconciled rounds.',
    },
    quote: {
      de: 'Ich sehe, du warst gründlich. Leider.',
      en: 'I see you were thorough. Unfortunately.',
    },
    metric: 'destruction',
    targets: DESTRUCTION_TARGETS_V1.map((target) => target.id),
    threshold: DESTRUCTION_TARGETS_V1.length,
    art: 'chaos',
  },
  ...ROOM_ACHIEVEMENTS_V1.map((entry): AchievementDefinition => ({
    ...entry,
    quote: { de: 'Das war eine Glanzleistung, Pixel.', en: 'That was brilliant, Pixel.' },
    metric: 'rooms',
    threshold: entry.targets.length,
    art: 'love',
  })),
];

const ACHIEVEMENTS_V1: readonly AchievementDefinition[] = [
  ...MILESTONES,
  {
    id: 'achievement.masterpiece-v1',
    name: { de: 'Pixels Meisterwerk', en: 'Pixel’s masterpiece' },
    description: {
      de: 'Alle anderen Erfolge dieser Sammlung freischalten.',
      en: 'Unlock every other achievement in this collection.',
    },
    quote: {
      de: 'Du hast wirklich an alles gedacht, Pixel.',
      en: 'You really thought of everything, Pixel.',
    },
    metric: 'all',
    targets: MILESTONES.map((entry) => entry.id),
    threshold: MILESTONES.length,
    art: 'love',
  },
];

const NEW_MILESTONES: readonly AchievementDefinition[] = [
  // eslint-disable-next-line max-lines-per-function -- Der vollständige Anzeigenvertrag einer versionierten Kategorie bleibt zusammen.
  ...ACHIEVEMENT_CATEGORIES_V2.map((category): AchievementDefinition => ({
    id: `achievement.category-${category.id}-v2`,
    name: category.name,
    description: {
      de: 'Alle Varianten vollständig ruinieren – über mehrere erfolgreich versöhnte Runden.',
      en: 'Fully ruin every variant across successfully reconciled rounds.',
    },
    quote: {
      de: 'Du hast wirklich nichts ausgelassen, Pixel.',
      en: 'You really left nothing out, Pixel.',
    },
    metric: 'variants',
    targets: category.targets,
    threshold: category.targets.length,
    art: 'chaos',
  })),
  {
    id: 'achievement.destruction-v2',
    name: { de: 'Meister der Zerstörung II', en: 'Master of destruction II' },
    description: {
      de: 'Alle neun Objektarten dieser Sammlung vollständig ruinieren, über erfolgreich versöhnte Runden.',
      en: 'Fully ruin all nine object types in this collection across successfully reconciled rounds.',
    },
    quote: {
      de: 'Jetzt also auch die Küche. Gründlich, Pixel.',
      en: 'The kitchen too, then. Thorough work, Pixel.',
    },
    metric: 'destruction',
    targets: DESTRUCTION_TARGETS.map((target) => target.id),
    threshold: DESTRUCTION_TARGETS.length,
    art: 'chaos',
  },
  ...ROOM_ACHIEVEMENTS_V2.map((entry): AchievementDefinition => ({
    ...entry,
    quote: { de: 'Gut gemacht, kleine Küchenchefin.', en: 'Well done, little kitchen chef.' },
    metric: 'rooms',
    threshold: entry.targets.length,
    art: 'love',
  })),
];
const CURRENT_OBJECTIVES = [...ACHIEVEMENTS_V1, ...NEW_MILESTONES];

export const ACHIEVEMENTS: readonly AchievementDefinition[] = [
  ...CURRENT_OBJECTIVES,
  {
    id: 'achievement.masterpiece-v2',
    name: { de: 'Pixels Meisterwerk II', en: 'Pixel’s masterpiece II' },
    description: {
      de: 'Alle anderen Erfolge der Sammlung mit Küche und Geschirr freischalten.',
      en: 'Unlock every other achievement in the kitchen and crockery collection.',
    },
    quote: {
      de: 'Ein zweites Meisterwerk. Ich hätte es wissen müssen.',
      en: 'A second masterpiece. I should have known.',
    },
    metric: 'all',
    targets: CURRENT_OBJECTIVES.map((entry) => entry.id),
    threshold: CURRENT_OBJECTIVES.length,
    art: 'love',
  },
];
