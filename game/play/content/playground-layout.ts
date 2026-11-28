import { BEDROOM } from './rooms/bedroom.ts';
import { OBJECTS } from './objects/catalog.ts';
import { LIVING_ROOM } from './rooms/living-room.ts';
import { COZY_REMIX } from './rooms/cozy-remix.ts';
import { KITCHEN_PREVIEW } from './rooms/kitchen-preview.ts';
import { resolveRoom } from './resolve-room.ts';
import type { ObjectInstance, RoomDefinition, ObjectCatalog } from './definitions.ts';

export const PLAYGROUND_BASES = {
  empty: {
    ...LIVING_ROOM,
    id: 'empty',
    width: 800,
    objects: [],
    platforms: [],
    decorations: [],
    objectSlots: [],
    wallSlots: undefined,
    difficultyObjects: undefined,
    goal: { ...LIVING_ROOM.goal, x: 700, surfaceId: 'floor' },
  },
  'living-room': LIVING_ROOM,
  'cozy-remix': COZY_REMIX,
  'kitchen-preview': KITCHEN_PREVIEW,
  bedroom: BEDROOM,
} as const;
export interface PlaygroundRecipe {
  readonly base: keyof typeof PLAYGROUND_BASES;
  readonly id: string;
  readonly width?: number;
  readonly spawn?: RoomDefinition['spawn'];
  readonly platforms?: RoomDefinition['platforms'];
  readonly decorations?: RoomDefinition['decorations'];
  readonly objects: readonly ObjectInstance[];
}

/** The single validated placement path for editor actions and reproducible test recipes. */
// eslint-disable-next-line max-lines-per-function -- Variante, Kapazität und Inhaltsresolver validieren dieselbe atomare Platzierungsaktion.
export function spawnPlaygroundObject(
  layout: RoomDefinition,
  object: ObjectInstance,
  catalog: ObjectCatalog = OBJECTS,
) {
  if (!Object.hasOwn(catalog, object.variant)) throw new Error('Unbekannte Objektvariante.');

  if (layout.objects.length >= 100) throw new Error('Höchstens 100 Objekte pro Aufbau.');
  const next = { ...layout, objects: [...layout.objects, structuredClone(object)] };

  resolveRoom(next, catalog);

  return next;
}

// eslint-disable-next-line max-lines-per-function -- Validiertes Wiedereinsetzen erhält Identität und Reihenfolge samt abhängigen Auflagen.
export function movePlaygroundObject(
  layout: RoomDefinition,
  id: string,
  placement: ObjectInstance['placement'],
) {
  const object = layout.objects.find((entry) => entry.id === id);

  if (!object) throw new Error('Objekt fehlt im Aufbau.');

  const next = spawnPlaygroundObject(
    { ...layout, objects: layout.objects.filter((entry) => entry.id !== id) },
    { ...object, placement },
  );

  return {
    ...next,
    objects: layout.objects.map((entry) => (entry.id === id ? { ...object, placement } : entry)),
  };
}

export function removePlaygroundObject(layout: RoomDefinition, id: string) {
  if (!layout.objects.some((entry) => entry.id === id)) throw new Error('Objekt fehlt im Aufbau.');
  const next = { ...layout, objects: layout.objects.filter((entry) => entry.id !== id) };

  resolveRoom(next, OBJECTS);

  return next;
}

export function buildPlaygroundRecipe(recipe: PlaygroundRecipe): RoomDefinition {
  if (!recipe || !Object.hasOwn(PLAYGROUND_BASES, recipe.base))
    throw new Error('Unbekannter Grundaufbau.');

  if (!Array.isArray(recipe.objects) || recipe.objects.length > 100)
    throw new Error('Ungültige Objektliste.');
  let layout = recipeShell(recipe);

  for (const object of recipe.objects) layout = spawnPlaygroundObject(layout, object);
  resolveRoom(layout, OBJECTS);

  return layout;
}

// eslint-disable-next-line max-lines-per-function -- Exportiert ausschließlich reproduzierbare Aufbaudaten ohne Simulationszustand.
export function recipeForPlayground(layout: RoomDefinition): PlaygroundRecipe {
  return {
    base:
      layout.environment === 'bedroom'
        ? 'bedroom'
        : layout.environment === 'kitchen-preview'
          ? 'kitchen-preview'
          : 'living-room',
    id: layout.id,
    width: layout.width,
    spawn: layout.spawn,
    platforms: layout.platforms,
    decorations: layout.decorations,
    objects: layout.objects,
  };
}

// eslint-disable-next-line max-lines-per-function -- Begrenzte, rein deklarative Startgeometrie des gewählten Grundaufbaus.
function recipeShell(recipe: PlaygroundRecipe): RoomDefinition {
  const base = PLAYGROUND_BASES[recipe.base];
  const platforms = recipe.platforms ?? base.platforms;
  const width = recipe.width ?? base.width;

  return {
    ...base,
    id: recipe.id,
    width,
    spawn: recipe.spawn ?? base.spawn,
    platforms,
    decorations: recipe.decorations ?? base.decorations,
    objects: [],
    objectSlots: [],
    wallSlots: undefined,
    difficultyObjects: undefined,
    goal:
      base.goal.surfaceId === base.floor.id ||
      platforms.some((entry) => entry.id === base.goal.surfaceId)
        ? base.goal
        : { ...base.goal, surfaceId: 'floor', x: Math.min(700, width - 60) },
  };
}
